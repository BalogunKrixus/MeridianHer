-- Staff tools for the admin platform (PRD section 9): moderation queue and
-- actions, member sanctions and appeals, roles, PII reveal, member notes,
-- expert applications and invites, and the statistics behind the dashboards.
-- Every function checks the caller's role itself and writes the audit log.

create function app.require_staff() returns void
language plpgsql stable set search_path = '' as $$
begin
  if not app.is_staff() then raise exception 'staff_only' using errcode = '42501'; end if;
end;
$$;

create function app.require_admin() returns void
language plpgsql stable set search_path = '' as $$
begin
  if not app.is_admin() then raise exception 'admin_only' using errcode = '42501'; end if;
end;
$$;

-- Activity -------------------------------------------------------------------------

create function public.touch_last_active() returns void
language sql security definer set search_path = '' as $$
  update public.profiles set last_active_at = now()
  where user_id = auth.uid() and (last_active_at is null or last_active_at < now() - interval '1 hour')
$$;

-- Claims and notes -----------------------------------------------------------------

create table public.queue_claims (
  target_type public.target_type not null,
  target_id uuid not null,
  claimed_by uuid not null references public.profiles (user_id) on delete cascade,
  claimed_at timestamptz not null default now(),
  primary key (target_type, target_id)
);
alter table public.queue_claims enable row level security;
grant select on public.queue_claims to authenticated;
create policy queue_claims_staff on public.queue_claims for select to authenticated using (app.is_staff());

create table public.member_notes (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles (user_id) on delete cascade,
  author_id uuid references public.profiles (user_id) on delete set null,
  note text not null check (char_length(note) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.member_notes enable row level security;
grant select, insert (member_id, author_id, note) on public.member_notes to authenticated;
create policy member_notes_select on public.member_notes for select to authenticated using (app.is_staff());
create policy member_notes_insert on public.member_notes for insert to authenticated with check (app.is_staff() and author_id = auth.uid());

-- Moderation queue (PRD 9.3) -----------------------------------------------------------

create function app.queue_item(kind public.target_type, target uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  author uuid;
  item jsonb;
begin
  if kind = 'post' then
    select jsonb_build_object('title', p.title, 'content', coalesce(nullif(p.body_text, ''), p.title), 'post_id', p.id,
      'status', p.status, 'space', s.name, 'created_at', p.created_at, 'anonymous', p.fully_anonymous), p.author_id
    into item, author from public.posts p join public.spaces s on s.id = p.space_id where p.id = target;
  elsif kind = 'reply' then
    select jsonb_build_object('title', null, 'content', r.body_text, 'context', p.title, 'post_id', p.id,
      'status', r.status, 'space', s.name, 'created_at', r.created_at), r.author_id
    into item, author from public.replies r join public.posts p on p.id = r.post_id join public.spaces s on s.id = p.space_id where r.id = target;
  else
    select jsonb_build_object('title', null, 'content', 'Profile: ' || coalesce(display_name, 'no display name'), 'status', status::text, 'created_at', created_at), user_id
    into item, author from public.profiles where user_id = target;
  end if;
  if item is null then return null; end if;

  return item || jsonb_build_object(
    'target_type', kind,
    'target_id', target,
    'author', (select jsonb_build_object('id', p.user_id, 'name', coalesce(p.display_name, 'Former member'), 'role', p.role, 'status', p.status,
        'joined', p.created_at, 'warnings', (select count(*) from public.member_sanctions m where m.user_id = p.user_id))
      from public.profiles p where p.user_id = author),
    'reports', coalesce((select jsonb_agg(jsonb_build_object('reason', reason, 'count', n)) from (
        select reason, count(*) n from public.reports where target_type = kind and target_id = target and status <> 'resolved' group by reason
      ) r), '[]'),
    'notes', coalesce((select jsonb_agg(note) from public.reports where target_type = kind and target_id = target and note is not null and status <> 'resolved'), '[]'),
    'flags', coalesce((select jsonb_agg(jsonb_build_object('source', source, 'priority', priority, 'score', score, 'details', details))
      from public.moderation_flags where target_type = kind and target_id = target and resolved_at is null), '[]'),
    'priority', case when exists (select 1 from public.moderation_flags where target_type = kind and target_id = target and resolved_at is null and priority = 'urgent')
      or exists (select 1 from public.reports where target_type = kind and target_id = target and status <> 'resolved' and reason = 'self_harm') then 'urgent' else 'normal' end,
    'received_at', greatest(
      (select max(created_at) from public.reports where target_type = kind and target_id = target),
      (select max(created_at) from public.moderation_flags where target_type = kind and target_id = target)),
    'claimed_by', (select coalesce(p.display_name, 'a moderator') from public.queue_claims c join public.profiles p on p.user_id = c.claimed_by
      where c.target_type = kind and c.target_id = target)
  );
end;
$$;

-- tab: urgent, reported, held, appeals, resolved
create function public.staff_queue(tab text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  perform app.require_staff();
  if tab = 'appeals' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'target_type', 'profile', 'target_id', m.user_id, 'sanction_id', m.id, 'kind', m.kind, 'reason', m.reason,
      'appeal_text', m.appeal_text, 'appealed_at', m.appealed_at, 'until', m.until,
      'author', jsonb_build_object('id', p.user_id, 'name', p.display_name, 'joined', p.created_at)) order by m.appealed_at), '[]')
    into result
    from public.member_sanctions m join public.profiles p on p.user_id = m.user_id where m.appeal_status = 'pending';
    return result;
  end if;
  if tab = 'resolved' then
    select coalesce(jsonb_agg(jsonb_build_object('id', a.id, 'action', a.action, 'target_type', a.target_type, 'target_id', a.target_id,
      'reason', coalesce(a.reason_text, a.reason_code), 'moderator', coalesce(p.display_name, 'Staff'), 'at', a.created_at) order by a.created_at desc), '[]')
    into result
    from (select * from public.moderation_actions order by created_at desc limit 100) a left join public.profiles p on p.user_id = a.moderator_id;
    return result;
  end if;

  with targets as (
    select target_type, target_id from public.moderation_flags where resolved_at is null and (tab <> 'urgent' or priority = 'urgent')
    union
    select target_type, target_id from public.reports where status <> 'resolved' and (tab <> 'urgent' or reason = 'self_harm')
    union
    select 'post'::public.target_type, id from public.posts where status = 'held' and deleted_at is null and tab = 'held'
    union
    select 'reply'::public.target_type, id from public.replies where status = 'held' and deleted_at is null and tab = 'held'
  ), items as (
    select app.queue_item(t.target_type, t.target_id) as item from targets t
  )
  select coalesce(jsonb_agg(item order by (item ->> 'priority') = 'urgent' desc, item ->> 'received_at'), '[]') into result
  from items
  where item is not null
    and case tab
      when 'urgent' then item ->> 'priority' = 'urgent'
      when 'reported' then jsonb_array_length(item -> 'reports') > 0
      when 'held' then item ->> 'status' = 'held'
      else true
    end;
  return result;
end;
$$;

create function public.staff_queue_counts() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform app.require_staff();
  return jsonb_build_object(
    'urgent', (select count(distinct (target_type, target_id)) from (
      select target_type, target_id from public.moderation_flags where resolved_at is null and priority = 'urgent'
      union select target_type, target_id from public.reports where status <> 'resolved' and reason = 'self_harm') u),
    'reported', (select count(distinct (target_type, target_id)) from public.reports where status <> 'resolved'),
    'held', (select count(*) from public.posts where status = 'held' and deleted_at is null) + (select count(*) from public.replies where status = 'held' and deleted_at is null),
    'appeals', (select count(*) from public.member_sanctions where appeal_status = 'pending'),
    'applications', (select count(*) from public.expert_applications where status in ('submitted', 'in_review'))
  );
end;
$$;

create function public.claim_item(kind public.target_type, target uuid, release boolean default false) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform app.require_staff();
  if release then
    delete from public.queue_claims where target_type = kind and target_id = target and claimed_by = auth.uid();
  else
    insert into public.queue_claims (target_type, target_id, claimed_by) values (kind, target, auth.uid())
    on conflict (target_type, target_id) do update set claimed_by = excluded.claimed_by, claimed_at = now();
    update public.reports set status = 'claimed', claimed_by = auth.uid(), claimed_at = now()
    where target_type = kind and target_id = target and status = 'open';
  end if;
end;
$$;

-- Content actions (PRD section 8, layer 3) -------------------------------------------------

-- action: approve, hide, restore, lock, unlock, pin, unpin, warn_content, move, dismiss
create function public.moderate(kind public.target_type, target uuid, action text, reason_code text default null,
  reason_text text default null, extra jsonb default '{}') returns void
language plpgsql security definer set search_path = '' as $$
declare
  before_row jsonb;
  after_row jsonb;
  author uuid;
  post_id uuid;
  post_title text;
begin
  perform app.require_staff();
  if action = 'hide' and coalesce(reason_code, reason_text) is null then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  if kind = 'post' then
    select to_jsonb(p) - 'search_vector' - 'body', p.author_id, p.id, p.title into before_row, author, post_id, post_title from public.posts p where p.id = target;
    if before_row is null then raise exception 'not_found' using errcode = 'P0002'; end if;
    case action
      when 'approve', 'restore' then update public.posts set status = 'published' where id = target;
      when 'hide' then update public.posts set status = 'hidden' where id = target;
      when 'lock' then update public.posts set locked = true where id = target;
      when 'unlock' then update public.posts set locked = false where id = target;
      when 'pin' then update public.posts set pinned = true where id = target;
      when 'unpin' then update public.posts set pinned = false where id = target;
      when 'warn_content' then update public.posts set content_warning = (extra ->> 'warning')::public.content_warning where id = target;
      when 'move' then update public.posts set space_id = (extra ->> 'space_id')::uuid where id = target;
      when 'dismiss' then null;
      else raise exception 'unknown_action' using errcode = '22023';
    end case;
    select to_jsonb(p) - 'search_vector' - 'body' into after_row from public.posts p where p.id = target;
  elsif kind = 'reply' then
    select to_jsonb(r) - 'search_vector' - 'body', r.author_id, r.post_id into before_row, author, post_id from public.replies r where r.id = target;
    if before_row is null then raise exception 'not_found' using errcode = 'P0002'; end if;
    select title into post_title from public.posts where id = post_id;
    case action
      when 'approve', 'restore' then update public.replies set status = 'published' where id = target;
      when 'hide' then update public.replies set status = 'hidden' where id = target;
      when 'dismiss' then null;
      else raise exception 'unknown_action' using errcode = '22023';
    end case;
    select to_jsonb(r) - 'search_vector' - 'body' into after_row from public.replies r where r.id = target;
  else
    if action <> 'dismiss' then raise exception 'unknown_action' using errcode = '22023'; end if;
  end if;

  insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason_code, reason_text, before, after)
  values (auth.uid(), kind, target, action, reason_code, reason_text, before_row, after_row);
  perform app.write_audit(action || ' ' || kind, kind::text, target, before_row, after_row, coalesce(reason_text, reason_code));

  if action in ('approve', 'hide', 'dismiss', 'restore') then
    update public.reports set status = 'resolved', resolution = action, resolved_by = auth.uid(), resolved_at = now()
    where target_type = kind and target_id = target and status <> 'resolved';
    update public.moderation_flags set resolved_at = now() where target_type = kind and target_id = target and resolved_at is null;
    delete from public.queue_claims where target_type = kind and target_id = target;
  end if;

  if action = 'hide' then
    perform app.notify(author, 'moderation', jsonb_build_object('action', 'hidden', 'target_type', kind, 'post_id', post_id,
      'post_title', post_title, 'reason', coalesce(reason_text, reason_code)));
  elsif action = 'approve' and before_row ->> 'status' = 'held' then
    perform app.notify(author, 'moderation', jsonb_build_object('action', 'approved', 'target_type', kind, 'post_id', post_id, 'post_title', post_title));
  end if;
end;
$$;

-- Member sanctions (PRD section 8) ----------------------------------------------------------

-- kind: warn, mute, ban, unmute, unban
create function public.sanction_member(member uuid, kind text, days integer default null, reason text default null) returns void
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
    when 'mute' then update public.profiles set status = 'muted', muted_until = now() + make_interval(days => coalesce(days, 1)) where user_id = member;
    when 'ban' then update public.profiles set status = 'banned', muted_until = null where user_id = member;
    when 'unmute', 'unban' then update public.profiles set status = 'active', muted_until = null where user_id = member;
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

-- A member may appeal each sanction once
create function public.appeal_sanction(sanction uuid, message text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.member_sanctions set appeal_text = left(message, 2000), appeal_status = 'pending', appealed_at = now()
  where id = sanction and user_id = auth.uid() and appeal_status is null;
  if not found then raise exception 'cannot_appeal' using errcode = 'P0001'; end if;
end;
$$;

create function public.decide_appeal(sanction uuid, overturn boolean, note text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s public.member_sanctions;
begin
  perform app.require_staff();
  update public.member_sanctions set appeal_status = case when overturn then 'overturned' else 'upheld' end::public.appeal_status
  where id = sanction and appeal_status = 'pending' returning * into s;
  if s is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if overturn and s.kind in ('mute', 'ban') then
    update public.profiles set status = 'active', muted_until = null where user_id = s.user_id;
  end if;
  perform app.notify(s.user_id, 'moderation', jsonb_build_object('action', case when overturn then 'appeal_overturned' else 'appeal_upheld' end, 'reason', note));
  perform app.write_audit('decide appeal', 'profile', s.user_id, null, jsonb_build_object('overturned', overturn), note);
end;
$$;

-- Roles and PII (PRD 9.4) ------------------------------------------------------------------

create function public.set_member_role(member uuid, new_role public.app_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform app.require_admin();
  if member = auth.uid() then raise exception 'not_yourself' using errcode = '42501'; end if;
  if (new_role in ('admin', 'super_admin') or (select role from public.profiles where user_id = member) in ('admin', 'super_admin'))
    and not app.is_super_admin() then
    raise exception 'super_admin_only' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where user_id = member;
end;
$$;

-- field: email or google_name. Every reveal is logged with its reason.
create function public.reveal_member_pii(member uuid, field text, reason text) returns text
language plpgsql security definer set search_path = '' as $$
declare
  value text;
begin
  perform app.require_admin();
  if char_length(coalesce(reason, '')) < 5 then raise exception 'reason_required' using errcode = '22023'; end if;
  select case field when 'email' then u.email when 'google_name' then u.raw_user_meta_data ->> 'full_name' end
  into value from auth.users u where u.id = member;
  insert into public.pii_access_log (admin_id, member_id, field, reason) values (auth.uid(), member, field, reason);
  perform app.write_audit('reveal ' || field, 'profile', member, null, null, reason);
  return value;
end;
$$;

create function public.staff_members(search text default null, in_status text default null, in_role text default null, max_rows integer default 200)
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  result jsonb;
begin
  perform app.require_staff();
  select coalesce(jsonb_agg(row order by row ->> 'joined' desc), '[]') into result from (
    select jsonb_build_object(
      'user_id', p.user_id, 'display_name', coalesce(p.display_name, '(not onboarded)'), 'role', p.role, 'status', p.status,
      'muted_until', p.muted_until, 'joined', p.created_at, 'last_active', p.last_active_at,
      'posts', (select count(*) from public.posts where author_id = p.user_id),
      'replies', (select count(*) from public.replies where author_id = p.user_id),
      'reports_against', (select count(*) from public.reports r where (r.target_type = 'profile' and r.target_id = p.user_id)
        or (r.target_type = 'post' and r.target_id in (select id from public.posts where author_id = p.user_id))
        or (r.target_type = 'reply' and r.target_id in (select id from public.replies where author_id = p.user_id))),
      'warnings', (select count(*) from public.member_sanctions where user_id = p.user_id)
    ) as row
    from public.profiles p
    where (search is null or p.display_name ilike '%' || search || '%')
      and (in_status is null or p.status::text = in_status)
      and (in_role is null or p.role::text = in_role)
    order by p.created_at desc
    limit max_rows
  ) t;
  return result;
end;
$$;

create function public.staff_member_detail(member uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform app.require_staff();
  return (
    select jsonb_build_object(
      'profile', jsonb_build_object('user_id', p.user_id, 'display_name', p.display_name, 'role', p.role, 'status', p.status,
        'muted_until', p.muted_until, 'joined', p.created_at, 'last_active', p.last_active_at, 'birth_year_set', p.birth_year is not null),
      'posts', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'status', status, 'deleted', deleted_at is not null, 'created_at', created_at) order by created_at desc)
        from (select * from public.posts where author_id = member order by created_at desc limit 50) x), '[]'),
      'replies', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'post_id', post_id, 'text', left(body_text, 200), 'status', status, 'created_at', created_at) order by created_at desc)
        from (select * from public.replies where author_id = member order by created_at desc limit 50) x), '[]'),
      'sanctions', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'kind', s.kind, 'reason', s.reason, 'until', s.until, 'appeal_status', s.appeal_status,
        'by', coalesce(i.display_name, 'Staff'), 'at', s.created_at) order by s.created_at desc)
        from public.member_sanctions s left join public.profiles i on i.user_id = s.issued_by where s.user_id = member), '[]'),
      'notes', coalesce((select jsonb_agg(jsonb_build_object('note', n.note, 'by', coalesce(a.display_name, 'Staff'), 'at', n.created_at) order by n.created_at desc)
        from public.member_notes n left join public.profiles a on a.user_id = n.author_id where n.member_id = member), '[]'),
      'history', coalesce((select jsonb_agg(jsonb_build_object('action', l.action, 'by', coalesce(a.display_name, 'System'), 'reason', l.reason, 'at', l.at) order by l.at desc)
        from (select * from public.audit_log where target_id = member order by at desc limit 50) l left join public.profiles a on a.user_id = l.actor_id), '[]')
    )
    from public.profiles p where p.user_id = member
  );
end;
$$;

-- Experts (PRD section 7) ---------------------------------------------------------------------

create function public.invite_expert(email text, name text, category public.expert_category) returns text
language plpgsql security definer set search_path = '' as $$
declare
  token text := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');
begin
  perform app.require_admin();
  insert into public.expert_invites (email, name, category, token_hash, invited_by)
  values (lower(btrim(email)), btrim(name), category, encode(sha256(convert_to(token, 'UTF8')), 'hex'), auth.uid());
  perform app.write_audit('invite expert', 'expert_invite', null, null, jsonb_build_object('email', lower(btrim(email)), 'category', category));
  return token;
end;
$$;

create function public.invite_details(token text) returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('name', name, 'category', category)
  from public.expert_invites
  where token_hash = encode(sha256(convert_to(token, 'UTF8')), 'hex') and accepted_at is null and expires_at > now()
$$;

create function public.submit_expert_application(data jsonb, invite_token text default null) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  invite public.expert_invites;
  app_id uuid;
begin
  if not app.can_act() then raise exception 'not_member' using errcode = '42501'; end if;
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
    data ->> 'legal_name', data ->> 'title', (data ->> 'category')::public.expert_category, nullif(data ->> 'category_other', ''),
    array(select jsonb_array_elements_text(data -> 'specialties')), data ->> 'licensing_body', data ->> 'licence_number',
    data ->> 'country', (data ->> 'years_in_practice')::smallint, nullif(data ->> 'workplace', ''), data ->> 'profile_url',
    data ->> 'bio', array(select jsonb_array_elements_text(coalesce(data -> 'document_paths', '[]'))))
  returning id into app_id;

  if invite.id is not null then
    update public.expert_invites set accepted_at = now() where id = invite.id;
  end if;
  return app_id;
end;
$$;

-- decision: in_review, more_info, approved, rejected
create function public.review_application(application uuid, decision public.application_status, reason text default null,
  handle text default null, public_name text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare
  a public.expert_applications;
begin
  perform app.require_admin();
  select * into a from public.expert_applications where id = application;
  if a is null then raise exception 'not_found' using errcode = 'P0002'; end if;
  if decision in ('more_info', 'rejected') and coalesce(reason, '') = '' then
    raise exception 'reason_required' using errcode = '22023';
  end if;

  update public.expert_applications set status = decision, reviewer_id = auth.uid(), decision_reason = reason, reviewed_at = now()
  where id = application;

  if decision = 'approved' then
    insert into public.expert_profiles (user_id, handle, public_name, legal_name, title, category, category_other, specialties,
      licensing_body, licence_number, country, bio, verified_at, renewal_due)
    values (a.user_id, lower(handle), public_name, a.legal_name, a.title, a.category, a.category_other, a.specialties,
      a.licensing_body, a.licence_number, a.country, a.bio, now(), now() + interval '1 year')
    on conflict (user_id) do update set status = 'active', verified_at = now(), renewal_due = now() + interval '1 year',
      title = excluded.title, category = excluded.category, specialties = excluded.specialties, bio = excluded.bio;
    update public.profiles set role = 'expert' where user_id = a.user_id and role = 'member';
  end if;

  if decision <> 'in_review' then
    perform app.notify(a.user_id, 'expert_application', jsonb_build_object('status', decision, 'reason', reason));
  end if;
  perform app.write_audit('review expert application', 'expert_application', application, jsonb_build_object('status', a.status),
    jsonb_build_object('status', decision), reason);
end;
$$;

-- status: active, suspended, revoked. Past answers stay; they lose the badge.
create function public.set_expert_status(expert uuid, new_status public.expert_status, reason text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform app.require_admin();
  if coalesce(reason, '') = '' then raise exception 'reason_required' using errcode = '22023'; end if;
  update public.expert_profiles set status = new_status where user_id = expert;
  if not found then raise exception 'not_found' using errcode = 'P0002'; end if;
  update public.profiles set role = case when new_status = 'active' then 'expert' else 'member' end::public.app_role
  where user_id = expert and role in ('member', 'expert');
  perform app.write_audit('set expert status', 'profile', expert, null, jsonb_build_object('status', new_status), reason);
end;
$$;

-- Run daily (pg_cron): suspend experts 30 days past their renewal date (PRD section 7)
create function app.expire_experts() returns integer
language plpgsql security definer set search_path = '' as $$
declare
  n integer;
begin
  update public.expert_profiles set status = 'suspended' where status = 'active' and renewal_due < now() - interval '30 days';
  get diagnostics n = row_count;
  return n;
end;
$$;

-- Dashboards (PRD 9.2 and 9.8) ---------------------------------------------------------------

create function public.admin_overview(days integer default 7, in_space uuid default null) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  since timestamptz := now() - make_interval(days => days);
  before timestamptz := now() - make_interval(days => days * 2);
begin
  perform app.require_staff();
  return jsonb_build_object(
    'headline', jsonb_build_object(
      'members', (select count(*) from public.profiles where onboarding_complete),
      'new_members', (select count(*) from public.profiles where onboarding_complete and created_at >= since),
      'new_members_before', (select count(*) from public.profiles where onboarding_complete and created_at >= before and created_at < since),
      'active', (select count(*) from public.profiles where last_active_at >= since),
      'active_before', (select count(*) from public.profiles where last_active_at >= before and last_active_at < since),
      'posts', (select count(*) from public.posts where created_at >= since and (in_space is null or space_id = in_space)),
      'posts_before', (select count(*) from public.posts where created_at >= before and created_at < since and (in_space is null or space_id = in_space)),
      'replies', (select count(*) from public.replies r join public.posts p on p.id = r.post_id where r.created_at >= since and (in_space is null or p.space_id = in_space)),
      'replies_before', (select count(*) from public.replies r join public.posts p on p.id = r.post_id where r.created_at >= before and r.created_at < since and (in_space is null or p.space_id = in_space))
    ),
    'attention', public.staff_queue_counts() || jsonb_build_object(
      'unanswered_expert', (select count(*) from public.posts p where p.ask_expert and not p.has_expert_answer and p.status = 'published'
        and p.deleted_at is null and p.created_at < now() - interval '48 hours' and (in_space is null or p.space_id = in_space))),
    'activity', (select coalesce(jsonb_agg(jsonb_build_object('day', d::date,
        'posts', (select count(*) from public.posts p where p.created_at::date = d::date and (in_space is null or p.space_id = in_space)),
        'replies', (select count(*) from public.replies r join public.posts p on p.id = r.post_id where r.created_at::date = d::date and (in_space is null or p.space_id = in_space)),
        'members', (select count(*) from public.profiles where created_at::date = d::date)) order by d), '[]')
      from generate_series(date_trunc('day', now()) - make_interval(days => greatest(days, 7) - 1), date_trunc('day', now()), interval '1 day') d),
    'response', (
      with q as (
        select p.id, p.created_at,
          (select min(r.created_at) from public.replies r where r.post_id = p.id and r.status = 'published' and r.author_id is distinct from p.author_id) as first_reply,
          (select min(r.created_at) from public.replies r where r.post_id = p.id and r.is_expert_answer) as first_expert
        from public.posts p
        where p.type = 'question' and p.status = 'published' and p.created_at >= since and p.created_at < now() - interval '24 hours'
          and (in_space is null or p.space_id = in_space)
      )
      select jsonb_build_object(
        'questions', count(*),
        'answered_24h_pct', case when count(*) = 0 then null else round(100.0 * count(*) filter (where first_reply < created_at + interval '24 hours') / count(*)) end,
        'median_first_reply_minutes', round(extract(epoch from percentile_cont(0.5) within group (order by first_reply - created_at)) / 60),
        'median_expert_hours', round(extract(epoch from percentile_cont(0.5) within group (order by first_expert - created_at)) / 3600))
      from q),
    'spaces', (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'name', s.name, 'tone', s.accent_color,
        'members', (select count(*) from public.space_follows f where f.space_id = s.id),
        'posts', (select count(*) from public.posts p where p.space_id = s.id and p.created_at >= since),
        'unanswered', (select count(*) from public.posts p where p.space_id = s.id and p.reply_count = 0 and p.type = 'question' and p.status = 'published' and p.deleted_at is null),
        'reports', (select count(*) from public.reports r join public.posts p on r.target_type = 'post' and p.id = r.target_id where p.space_id = s.id and r.status <> 'resolved'))
        order by s.sort_order), '[]') from public.spaces s where not s.archived),
    'experts', (select coalesce(jsonb_agg(row order by (row ->> 'answers')::int desc), '[]') from (
        select jsonb_build_object('name', e.public_name, 'category', e.category,
          'answers', (select count(*) from public.replies r where r.author_id = e.user_id and r.created_at >= date_trunc('month', now())),
          'helpful', (select count(*) from public.reactions x join public.replies r on x.target_type = 'reply' and r.id = x.target_id
            where r.author_id = e.user_id and x.kind = 'helpful')) as row
        from public.expert_profiles e where e.status = 'active') t),
    'moderation', jsonb_build_object(
      'reports_in', (select count(*) from public.reports where created_at >= since),
      'resolved', (select count(*) from public.reports where resolved_at >= since),
      'median_resolution_hours', (select round(extract(epoch from percentile_cont(0.5) within group (order by resolved_at - created_at)) / 3600, 1)
        from public.reports where resolved_at >= since))
  );
end;
$$;

create function public.admin_analytics() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  perform app.require_admin();
  return jsonb_build_object(
    'cohorts', (select coalesce(jsonb_agg(row order by row ->> 'week'), '[]') from (
      select jsonb_build_object('week', date_trunc('week', created_at)::date, 'members', count(*),
        'returned_month_2', count(*) filter (where last_active_at >= created_at + interval '30 days')) as row
      from public.profiles where onboarding_complete and created_at >= now() - interval '12 weeks'
      group by date_trunc('week', created_at)) c),
    'activation', (select jsonb_build_object('members', count(*), 'acted_7d', count(*) filter (where exists (
        select 1 from public.posts where author_id = p.user_id and created_at < p.created_at + interval '7 days'
        union all select 1 from public.replies where author_id = p.user_id and created_at < p.created_at + interval '7 days'
        union all select 1 from public.reactions where user_id = p.user_id and created_at < p.created_at + interval '7 days')))
      from public.profiles p where p.onboarding_complete and p.created_at < now() - interval '7 days'),
    'zero_result_searches', (select coalesce(jsonb_agg(jsonb_build_object('term', term, 'count', n) order by n desc), '[]') from (
      select term, count(*) n from public.search_log where results = 0 and created_at >= now() - interval '30 days' group by term order by n desc limit 25) z),
    'searches', (select jsonb_build_object('total', count(*), 'zero', count(*) filter (where results = 0)) from public.search_log where created_at >= now() - interval '30 days'),
    'most_viewed', (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'title', title, 'views', view_count) order by view_count desc), '[]') from (
      select id, title, view_count from public.posts where status = 'published' and deleted_at is null order by view_count desc limit 15) v),
    'space_growth', (select coalesce(jsonb_agg(jsonb_build_object('name', s.name,
        'followers', (select count(*) from public.space_follows f where f.space_id = s.id),
        'new_30d', (select count(*) from public.space_follows f where f.space_id = s.id and f.created_at >= now() - interval '30 days'),
        'posts_30d', (select count(*) from public.posts p where p.space_id = s.id and p.created_at >= now() - interval '30 days')) order by s.sort_order), '[]')
      from public.spaces s where not s.archived),
    'helpful_share', (select jsonb_build_object('replies', count(*), 'helpful', count(*) filter (where is_helped_me or (reaction_counts ->> 'helpful')::int > 0))
      from public.replies where created_at >= now() - interval '30 days')
  );
end;
$$;

-- Grants ------------------------------------------------------------------------------------

revoke all on function app.require_staff(), app.require_admin(), app.queue_item(public.target_type, uuid), app.expire_experts() from public;
grant execute on function app.require_staff(), app.require_admin() to authenticated;

revoke all on function public.touch_last_active(), public.staff_queue(text), public.staff_queue_counts(),
  public.claim_item(public.target_type, uuid, boolean), public.moderate(public.target_type, uuid, text, text, text, jsonb),
  public.sanction_member(uuid, text, integer, text), public.appeal_sanction(uuid, text), public.decide_appeal(uuid, boolean, text),
  public.set_member_role(uuid, public.app_role), public.reveal_member_pii(uuid, text, text), public.staff_members(text, text, text, integer),
  public.staff_member_detail(uuid), public.invite_expert(text, text, public.expert_category), public.invite_details(text),
  public.submit_expert_application(jsonb, text), public.review_application(uuid, public.application_status, text, text, text),
  public.set_expert_status(uuid, public.expert_status, text), public.admin_overview(integer, uuid), public.admin_analytics()
from public, anon, authenticated;

grant execute on function public.touch_last_active(), public.staff_queue(text), public.staff_queue_counts(),
  public.claim_item(public.target_type, uuid, boolean), public.moderate(public.target_type, uuid, text, text, text, jsonb),
  public.sanction_member(uuid, text, integer, text), public.appeal_sanction(uuid, text), public.decide_appeal(uuid, boolean, text),
  public.set_member_role(uuid, public.app_role), public.reveal_member_pii(uuid, text, text), public.staff_members(text, text, text, integer),
  public.staff_member_detail(uuid), public.invite_expert(text, text, public.expert_category), public.invite_details(text),
  public.submit_expert_application(jsonb, text), public.review_application(uuid, public.application_status, text, text, text),
  public.set_expert_status(uuid, public.expert_status, text), public.admin_overview(integer, uuid), public.admin_analytics()
to authenticated;
