-- Fixes from the independent review of the full build.

-- 1. Links inside rich text are screened too ------------------------------------------
-- A link's address lives in its mark, not in the visible text, so the allowlist check
-- now also reads every href in the document.
create or replace function app.screen_content() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  kind public.target_type := case when tg_table_name = 'posts' then 'post' else 'reply' end;
  hrefs text := coalesce(
    (select string_agg(h #>> '{}', ' ') from jsonb_array_elements(jsonb_path_query_array(new.body, 'strict $.**.href')) h), '');
  content text := coalesce(to_jsonb(new) ->> 'title', '') || ' ' || app.rich_text_plain(new.body) || ' ' || hrefs;
  result jsonb;
begin
  -- Only members' own writes are screened; staff tools and the team account are trusted
  if auth.uid() is null or new.as_team then
    return new;
  end if;
  result := app.screen_text(content);
  if (result ->> 'block')::boolean then
    raise exception 'blocked_words' using errcode = 'P0001';
  end if;
  if jsonb_array_length(result -> 'hold') > 0 then
    new.status := 'held';
    insert into public.moderation_flags (target_type, target_id, source, details)
    values (kind, new.id, (case when (result -> 'hold')::text like '%link to%' then 'link' else 'keyword' end)::public.flag_source,
            jsonb_build_object('found', result -> 'hold'));
  end if;
  if (result ->> 'crisis')::boolean then
    insert into public.moderation_flags (target_type, target_id, source, priority, details)
    values (kind, new.id, 'keyword', 'urgent', jsonb_build_object('found', 'crisis words'));
  end if;
  return new;
end;
$$;

-- 2. Her replies on her own anonymous post stay anonymous -------------------------------
create or replace view public.thread_replies with (security_barrier = true) as
select
  r.id,
  r.post_id,
  r.parent_reply_id,
  r.status <> 'published' or r.deleted_at is not null as removed,
  case when r.status = 'published' and r.deleted_at is null then r.body end as body,
  case when r.status = 'published' and r.deleted_at is null then r.reaction_counts end as reaction_counts,
  case
    when r.status <> 'published' or r.deleted_at is not null then null
    when r.as_team then 'MeridianHer Team'
    when p.fully_anonymous and r.author_id is not distinct from p.author_id then 'Anonymous member'
    when r.author_role_snapshot = 'expert' and e.public_name is not null then e.public_name
    when pr.display_name is null then 'Former member'
    else pr.display_name
  end as author_name,
  case
    when r.as_team or r.status <> 'published' or r.deleted_at is not null then null
    when p.fully_anonymous and r.author_id is not distinct from p.author_id then null
    else r.author_id
  end as author_user_id,
  r.as_team,
  r.author_role_snapshot = 'expert' as by_expert,
  r.expert_category_snapshot as expert_category,
  case when r.author_role_snapshot = 'expert' then e.handle end as expert_handle,
  r.author_role_snapshot = 'expert' and e.status is distinct from 'active' as expert_status_ended,
  r.is_expert_answer,
  r.is_helped_me,
  r.edited_at,
  r.created_at,
  r.author_id is not distinct from auth.uid() as is_mine
from public.replies r
join public.posts p on p.id = r.post_id
left join public.profiles pr on pr.user_id = r.author_id
left join public.expert_profiles e on e.user_id = r.author_id
where r.status <> 'held' and app.can_view_post(r.post_id);

-- 3. Team posts are not treated like a new member's posts -------------------------------
create or replace function app.posts_before_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or new.as_team then
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

-- Admins post as the team without first finishing community onboarding
drop policy posts_insert on public.posts;
create policy posts_insert on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and (
      (app.can_participate() and app.can_view_space(space_id) and not as_team and type <> 'announcement')
      or app.is_admin()
    )
  );

-- 4. Sanctions never downgrade a ban; overturning recomputes from what remains ----------
create or replace function public.sanction_member(member uuid, kind text, days integer default null, reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target public.profiles;
begin
  perform app.require_staff();
  select * into target from public.profiles where user_id = member;
  if target is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if member = auth.uid() then raise exception 'not_yourself' using errcode = '42501'; end if;
  if target.role in ('moderator', 'admin', 'super_admin') and not app.is_super_admin() then
    raise exception 'cannot_sanction_staff' using errcode = '42501';
  end if;
  if kind in ('warn', 'mute', 'ban') and coalesce(reason, '') = '' then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  case kind
    when 'warn' then null;
    when 'mute' then
      update public.profiles set status = 'muted', muted_until = now() + make_interval(days => coalesce(days, 1))
      where user_id = member and status <> 'banned';
    when 'ban' then update public.profiles set status = 'banned', muted_until = null where user_id = member;
    when 'unmute' then update public.profiles set status = 'active', muted_until = null where user_id = member and status = 'muted';
    when 'unban' then update public.profiles set status = 'active', muted_until = null where user_id = member;
    else raise exception 'unknown_action' using errcode = '22023';
  end case;

  if kind in ('warn', 'mute', 'ban') then
    insert into public.member_sanctions (user_id, kind, until, reason, issued_by)
    values (member, kind::public.sanction_kind, case when kind = 'mute' then now() + make_interval(days => coalesce(days, 1)) end, reason, auth.uid());
    perform app.notify(member, 'moderation', jsonb_build_object('action', kind, 'reason', reason, 'days', days));
  end if;
  perform app.write_audit(kind || ' member', 'profile', member, null, jsonb_build_object('days', days), reason);
end;
$$;

create or replace function public.decide_appeal(sanction uuid, overturn boolean, note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.member_sanctions;
  mute_until timestamptz;
begin
  perform app.require_staff();
  update public.member_sanctions set appeal_status = case when overturn then 'overturned' else 'upheld' end::public.appeal_status
  where id = sanction and appeal_status = 'pending' returning * into s;
  if s is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if overturn and s.kind in ('mute', 'ban') then
    -- Only lift what this sanction caused: a later ban or a longer mute still stands
    if exists (select 1 from public.member_sanctions where user_id = s.user_id and id <> s.id and kind = 'ban'
               and appeal_status is distinct from 'overturned') then
      null;
    else
      select max(until) into mute_until from public.member_sanctions
      where user_id = s.user_id and id <> s.id and kind = 'mute' and until > now() and appeal_status is distinct from 'overturned';
      update public.profiles
      set status = case when mute_until is null then 'active' else 'muted' end::public.member_status, muted_until = mute_until
      where user_id = s.user_id;
    end if;
  end if;
  perform app.notify(s.user_id, 'moderation', jsonb_build_object('action', case when overturn then 'appeal_overturned' else 'appeal_upheld' end, 'reason', note));
  perform app.write_audit('decide appeal', 'profile', s.user_id, null, jsonb_build_object('overturned', overturn), note);
end;
$$;

-- 5. Expert applications are validated in the database, and can be answered ------------
create function app.check_application(data jsonb) returns void
language plpgsql immutable set search_path = '' as $$
begin
  if char_length(coalesce(btrim(data ->> 'legal_name'), '')) not between 3 and 120
    or char_length(coalesce(btrim(data ->> 'title'), '')) not between 2 and 80
    or char_length(coalesce(btrim(data ->> 'licensing_body'), '')) not between 2 and 80
    or char_length(coalesce(btrim(data ->> 'licence_number'), '')) not between 2 and 60
    or char_length(coalesce(btrim(data ->> 'country'), '')) not between 2 and 60
    or char_length(coalesce(btrim(data ->> 'bio'), '')) not between 20 and 300
    or coalesce(data ->> 'profile_url', '') !~ '^https://[^\s]+$'
    or jsonb_array_length(coalesce(data -> 'specialties', '[]')) not between 1 and 3
    or jsonb_array_length(coalesce(data -> 'document_paths', '[]')) not between 1 and 3
  then
    raise exception 'invalid_application' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.submit_expert_application(data jsonb, invite_token text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  invite public.expert_invites;
  app_id uuid;
begin
  if not app.can_act() then raise exception 'not_member' using errcode = '42501'; end if;
  perform app.check_application(data);
  -- Documents must be her own uploads
  if exists (select 1 from jsonb_array_elements_text(data -> 'document_paths') p where p not like auth.uid()::text || '/%') then
    raise exception 'not_your_document' using errcode = '42501';
  end if;
  if exists (select 1 from public.expert_applications where user_id = auth.uid() and status in ('submitted', 'in_review', 'more_info')) then
    raise exception 'already_applied' using errcode = 'P0001';
  end if;
  if invite_token is not null then
    select * into invite from public.expert_invites
    where token_hash = encode(sha256(convert_to(invite_token, 'UTF8')), 'hex') and accepted_at is null and expires_at > now();
  end if;

  insert into public.expert_applications (user_id, source, invite_id, legal_name, title, category, category_other, specialties,
    licensing_body, licence_number, country, years_in_practice, workplace, profile_url, bio, document_paths)
  values (auth.uid(), case when invite.id is null then 'applied' else 'invited' end::public.application_source, invite.id,
    btrim(data ->> 'legal_name'), btrim(data ->> 'title'), (data ->> 'category')::public.expert_category, nullif(data ->> 'category_other', ''),
    array(select jsonb_array_elements_text(data -> 'specialties')), btrim(data ->> 'licensing_body'), btrim(data ->> 'licence_number'),
    btrim(data ->> 'country'), (data ->> 'years_in_practice')::smallint, nullif(data ->> 'workplace', ''), data ->> 'profile_url',
    btrim(data ->> 'bio'), array(select jsonb_array_elements_text(data -> 'document_paths')))
  returning id into app_id;

  if invite.id is not null then
    update public.expert_invites set accepted_at = now() where id = invite.id;
  end if;
  return app_id;
end;
$$;

-- After "more info", she updates the same application and it goes back to the queue
create function public.resubmit_expert_application(data jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  app_id uuid;
begin
  if not app.can_act() then raise exception 'not_member' using errcode = '42501'; end if;
  perform app.check_application(data);
  if exists (select 1 from jsonb_array_elements_text(data -> 'document_paths') p where p not like auth.uid()::text || '/%') then
    raise exception 'not_your_document' using errcode = '42501';
  end if;
  update public.expert_applications set
    legal_name = btrim(data ->> 'legal_name'), title = btrim(data ->> 'title'), category = (data ->> 'category')::public.expert_category,
    category_other = nullif(data ->> 'category_other', ''), specialties = array(select jsonb_array_elements_text(data -> 'specialties')),
    licensing_body = btrim(data ->> 'licensing_body'), licence_number = btrim(data ->> 'licence_number'), country = btrim(data ->> 'country'),
    years_in_practice = (data ->> 'years_in_practice')::smallint, workplace = nullif(data ->> 'workplace', ''),
    profile_url = data ->> 'profile_url', bio = btrim(data ->> 'bio'),
    document_paths = array(select jsonb_array_elements_text(data -> 'document_paths')),
    status = 'submitted', decision_reason = null
  where user_id = auth.uid() and status = 'more_info'
  returning id into app_id;
  if app_id is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  return app_id;
end;
$$;

-- 6. Expiry also removes the expert role, and runs every night where pg_cron exists ---
create or replace function app.expire_experts() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  with expired as (
    update public.expert_profiles set status = 'suspended'
    where status = 'active' and renewal_due < now() - interval '30 days'
    returning user_id
  )
  update public.profiles set role = 'member' where user_id in (select user_id from expired) and role = 'expert';
  get diagnostics n = row_count;
  return n;
end;
$$;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('expire-experts', '15 2 * * *', 'select app.expire_experts()');
  end if;
exception when others then
  raise notice 'pg_cron not available, schedule app.expire_experts() yourself: %', sqlerrm;
end;
$$;

revoke all on function app.check_application(jsonb), public.resubmit_expert_application(jsonb) from public, anon, authenticated;
grant execute on function public.resubmit_expert_application(jsonb) to authenticated;
