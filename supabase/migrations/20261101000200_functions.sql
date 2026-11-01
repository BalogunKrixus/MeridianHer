-- Helper functions, triggers and the onboarding RPCs.
-- Security definer functions always pin search_path to '' and fully qualify names.

-- Viewer helpers (used by RLS policies and views) ------------------------------

create function app.viewer_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where user_id = auth.uid()
$$;

create function app.is_staff() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(app.viewer_role() in ('moderator', 'admin', 'super_admin'), false)
$$;

create function app.is_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(app.viewer_role() in ('admin', 'super_admin'), false)
$$;

create function app.is_super_admin() returns boolean
language sql stable set search_path = '' as $$
  select coalesce(app.viewer_role() = 'super_admin', false)
$$;

-- Age from year of birth only (we never ask for a full date).
create function app.age_from_birth_year(birth_year integer) returns integer
language sql stable set search_path = '' as $$
  select extract(year from now())::integer - birth_year
$$;

create function app.viewer_age() returns integer
language sql stable security definer set search_path = '' as $$
  select app.age_from_birth_year(birth_year) from public.profiles where user_id = auth.uid()
$$;

-- Staff see every space. Everyone else sees unarchived spaces they are old enough for.
-- Visitors have no age, so age gated spaces are hidden from them (PRD section 10).
create function app.can_view_space(target_space uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.spaces s
    where s.id = target_space
      and (app.is_staff() or (not s.archived and (s.min_age is null or app.viewer_age() >= s.min_age)))
  )
$$;

create function app.can_view_post(target_post uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.posts p
    where p.id = target_post and p.status = 'published' and p.deleted_at is null and app.can_view_space(p.space_id)
  )
$$;

create function app.can_view_target(kind public.target_type, target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case kind
    when 'post' then app.can_view_post(target)
    when 'reply' then exists (
      select 1 from public.replies r
      where r.id = target and r.status = 'published' and r.deleted_at is null and app.can_view_post(r.post_id)
    )
    when 'profile' then exists (select 1 from public.profiles where user_id = target and status <> 'banned')
  end
$$;

-- Onboarded, not banned, and not currently muted.
create function app.can_participate() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid()
      and onboarding_complete
      and (status = 'active' or (status = 'muted' and muted_until <= now()))
  )
$$;

-- Onboarded and not banned: may follow, react, save and report even while muted.
create function app.can_act() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where user_id = auth.uid() and onboarding_complete and status <> 'banned')
$$;

create function app.setting(setting_key text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select value from public.settings where key = setting_key
$$;

create function app.request_ip() returns inet
language plpgsql stable set search_path = '' as $$
begin
  return split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)::inet;
exception when others then
  return null;
end;
$$;

-- Audit log ------------------------------------------------------------------

create function app.write_audit(
  action text, target_type text, target_id uuid, before jsonb, after jsonb, reason text default null
) returns void
language sql security definer set search_path = '' as $$
  insert into public.audit_log (actor_id, action, target_type, target_id, before, after, reason, ip)
  values (auth.uid(), action, target_type, target_id, before, after, reason, app.request_ip())
$$;

create function app.reject_audit_change() returns trigger
language plpgsql as $$
begin
  raise exception 'audit_log is append only' using errcode = '42501';
end;
$$;

create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function app.reject_audit_change();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function app.reject_audit_change();

-- Admins edit these tables directly under RLS; every change is logged.
create function app.audit_row_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return coalesce(new, old);
  end if;
  perform app.write_audit(
    lower(tg_op) || ' ' || tg_table_name,
    tg_table_name,
    coalesce(new.id, old.id),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

create trigger audit_spaces after insert or update or delete on public.spaces
  for each row execute function app.audit_row_change();
create trigger audit_space_moderators after insert or update or delete on public.space_moderators
  for each row execute function app.audit_row_change();
create trigger audit_settings after insert or update or delete on public.settings
  for each row execute function app.audit_row_change();
create trigger audit_announcements after insert or update or delete on public.announcements
  for each row execute function app.audit_row_change();

-- Accounts -------------------------------------------------------------------

create function app.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function app.handle_new_user();

-- Role and status changes are always audited, whoever makes them.
create function app.audit_profile_access_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role or new.status is distinct from old.status then
    perform app.write_audit(
      'change member access', 'profile', new.user_id,
      jsonb_build_object('role', old.role, 'status', old.status, 'muted_until', old.muted_until),
      jsonb_build_object('role', new.role, 'status', new.status, 'muted_until', new.muted_until)
    );
  end if;
  return new;
end;
$$;

create trigger audit_profile_access after update on public.profiles
  for each row execute function app.audit_profile_access_change();

-- Free when no profile holds it and nobody released it in the last 90 days.
create function public.display_name_available(name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select not exists (
    select 1 from public.profiles
    where lower(display_name) = lower(btrim(name)) and user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  ) and not exists (
    select 1 from public.display_name_history
    where lower(display_name) = lower(btrim(name))
      and released_at > now() - interval '90 days'
      and user_id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000')
  )
$$;

-- First time onboarding (PRD section 5). Under 16s are rejected with `under_age`;
-- the app then deletes the account so we keep nothing about them.
create function public.complete_onboarding(
  display_name text, birth_year integer, space_slugs text[], accept_guidelines boolean
) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  clean_name text := regexp_replace(btrim(display_name), '\s+', ' ', 'g');
  age integer := app.age_from_birth_year(birth_year);
  followed integer;
begin
  if me is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;
  if exists (select 1 from public.profiles where user_id = me and onboarding_complete) then
    raise exception 'already_onboarded' using errcode = 'P0001';
  end if;
  if birth_year > extract(year from now()) or birth_year < 1900 then
    raise exception 'invalid_birth_year' using errcode = '22023';
  end if;
  if age < 16 then
    raise exception 'under_age' using errcode = 'P0001';
  end if;
  if not coalesce(accept_guidelines, false) then
    raise exception 'guidelines_not_accepted' using errcode = 'P0001';
  end if;
  if not public.display_name_available(clean_name) then
    raise exception 'display_name_taken' using errcode = '23505';
  end if;

  update public.profiles
  set display_name = clean_name,
      display_name_changed_at = now(),
      birth_year = complete_onboarding.birth_year,
      guidelines_accepted_at = now(),
      onboarding_complete = true,
      last_active_at = now()
  where user_id = me;

  insert into public.space_follows (space_id, user_id)
  select s.id, me from public.spaces s
  where s.slug = any (space_slugs) and not s.archived and (s.min_age is null or age >= s.min_age)
  on conflict do nothing;

  get diagnostics followed = row_count;
  if followed = 0 then
    raise exception 'no_spaces_chosen' using errcode = 'P0001';
  end if;
end;
$$;

-- Adds the member's role to the JWT for RLS and the admin middleware.
-- Enable in Supabase: Authentication, Hooks, Customize access token.
create function public.custom_access_token_hook(event jsonb) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_set(
    event,
    '{claims,user_role}',
    to_jsonb(coalesce((select role::text from public.profiles where user_id = (event ->> 'user_id')::uuid), 'member'))
  )
$$;

-- Posting rules ----------------------------------------------------------------

-- New accounts (under 24 hours by default) have their first 2 posts or replies held.
create function app.hold_if_new_account(author uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.user_id = author
      and p.created_at > now() - make_interval(hours => coalesce((app.setting('new_account_hold') ->> 'hours')::integer, 24))
  ) and (
    (select count(*) from public.posts where author_id = author)
    + (select count(*) from public.replies where author_id = author)
  ) < coalesce((app.setting('new_account_hold') ->> 'items')::integer, 2)
$$;

create function app.posts_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if (
    select count(*) from public.posts
    where author_id = new.author_id and created_at > now() - interval '1 hour'
  ) >= coalesce((app.setting('rate_limits') ->> 'posts_per_hour')::integer, 5) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if new.ask_expert and (
    new.type <> 'question'
    or not exists (select 1 from public.spaces where id = new.space_id and ask_expert_enabled)
  ) then
    new.ask_expert := false;
  end if;
  if app.hold_if_new_account(new.author_id) then
    new.status := 'held';
    insert into public.moderation_flags (target_type, target_id, source, details)
    values ('post', new.id, 'new_account', '{}');
  end if;
  return new;
end;
$$;

create trigger posts_before_insert before insert on public.posts
  for each row execute function app.posts_before_insert();

create function app.replies_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  parent public.replies;
  author public.profiles;
begin
  if not exists (
    select 1 from public.posts
    where id = new.post_id and status = 'published' and deleted_at is null and not locked
  ) then
    raise exception 'post_closed' using errcode = 'P0001';
  end if;

  if new.parent_reply_id is not null then
    select * into parent from public.replies where id = new.parent_reply_id;
    if parent.post_id is distinct from new.post_id or parent.parent_reply_id is not null then
      raise exception 'reply_too_deep' using errcode = 'P0001';
    end if;
  end if;

  select * into author from public.profiles where user_id = new.author_id;
  new.author_role_snapshot := coalesce(author.role, 'member');
  new.expert_category_snapshot := (
    select category from public.expert_profiles where user_id = new.author_id and status = 'active'
  );

  if auth.uid() is null then
    return new;
  end if;
  if (
    select count(*) from public.replies
    where author_id = new.author_id and created_at > now() - interval '1 hour'
  ) >= coalesce((app.setting('rate_limits') ->> 'replies_per_hour')::integer, 30) then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  if app.hold_if_new_account(new.author_id) then
    new.status := 'held';
    insert into public.moderation_flags (target_type, target_id, source, details)
    values ('reply', new.id, 'new_account', '{}');
  end if;
  return new;
end;
$$;

create trigger replies_before_insert before insert on public.replies
  for each row execute function app.replies_before_insert();

-- Authors may edit content for 24 hours; the edit is marked.
create function app.content_before_update() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() = old.author_id then
    if old.created_at < now() - interval '24 hours' then
      raise exception 'edit_window_closed' using errcode = 'P0001';
    end if;
    new.edited_at := now();
  end if;
  return new;
end;
$$;

create trigger posts_before_update before update of title, body, tags, content_warning on public.posts
  for each row execute function app.content_before_update();
create trigger replies_before_update before update of body on public.replies
  for each row execute function app.content_before_update();

-- Counts ---------------------------------------------------------------------

create function app.refresh_post_counts() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  target uuid := coalesce(new.post_id, old.post_id);
begin
  update public.posts p
  set reply_count = (
        select count(*) from public.replies r
        where r.post_id = target and r.status = 'published' and r.deleted_at is null
      ),
      has_expert_answer = exists (
        select 1 from public.replies r
        where r.post_id = target and r.is_expert_answer and r.status = 'published' and r.deleted_at is null
      )
  where p.id = target;
  return null;
end;
$$;

create trigger replies_refresh_post_counts after insert or delete or update of status, deleted_at, is_expert_answer on public.replies
  for each row execute function app.refresh_post_counts();

create function app.refresh_reaction_counts() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  changed_type public.target_type := coalesce(new.target_type, old.target_type);
  changed_id uuid := coalesce(new.target_id, old.target_id);
  counts jsonb;
begin
  select jsonb_build_object(
    'hug', count(*) filter (where r.kind = 'hug'),
    'same', count(*) filter (where r.kind = 'same'),
    'helpful', count(*) filter (where r.kind = 'helpful')
  ) into counts
  from public.reactions r where r.target_type = changed_type and r.target_id = changed_id;

  if changed_type = 'post' then
    update public.posts set reaction_counts = counts where id = changed_id;
  else
    update public.replies set reaction_counts = counts where id = changed_id;
  end if;
  return null;
end;
$$;

create trigger reactions_refresh_counts after insert or delete on public.reactions
  for each row execute function app.refresh_reaction_counts();

-- Reports (PRD section 8, layer 2) -----------------------------------------------

-- Self harm reports raise an urgent flag. Content reported by enough different
-- members (3 by default) is hidden until a moderator reviews it.
create function app.reports_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  threshold integer := coalesce((app.setting('report_auto_hide_threshold') #>> '{}')::integer, 3);
  reporters integer;
begin
  if new.reason = 'self_harm' then
    insert into public.moderation_flags (target_type, target_id, source, priority, details)
    values (new.target_type, new.target_id, 'keyword', 'urgent', jsonb_build_object('report_id', new.id));
  end if;

  select count(distinct reporter_id) into reporters
  from public.reports
  where target_type = new.target_type and target_id = new.target_id and status <> 'resolved';

  if reporters >= threshold then
    if new.target_type = 'post' then
      update public.posts set status = 'hidden' where id = new.target_id and status = 'published';
    elsif new.target_type = 'reply' then
      update public.replies set status = 'hidden' where id = new.target_id and status = 'published';
    end if;
    if found then
      insert into public.moderation_flags (target_type, target_id, source, details)
      values (new.target_type, new.target_id, 'threshold', jsonb_build_object('reports', reporters));
    end if;
  end if;
  return null;
end;
$$;

create trigger reports_after_insert after insert on public.reports
  for each row execute function app.reports_after_insert();
