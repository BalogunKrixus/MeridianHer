-- Community features: automated checks, notifications, following posts, search,
-- author actions, account settings and data export (PRD sections 5, 6 and 8).

-- Following posts (PRD 6.9) ----------------------------------------------------

create table public.post_follows (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (post_id, user_id)
);
create trigger set_updated_at before update on public.post_follows for each row execute function app.set_updated_at();
alter table public.post_follows enable row level security;
grant select, insert (post_id, user_id), delete on public.post_follows to authenticated;
create policy post_follows_select on public.post_follows for select to authenticated using (user_id = auth.uid());
create policy post_follows_insert on public.post_follows for insert to authenticated
  with check (user_id = auth.uid() and app.can_act() and app.can_view_post(post_id));
create policy post_follows_delete on public.post_follows for delete to authenticated using (user_id = auth.uid());

-- Authors follow their own posts automatically
create function app.follow_own_post() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.author_id is not null then
    insert into public.post_follows (post_id, user_id) values (new.id, new.author_id) on conflict do nothing;
  end if;
  return null;
end;
$$;
create trigger posts_follow_own after insert on public.posts for each row execute function app.follow_own_post();

-- Search terms with no identity attached, for content gap analytics (PRD 9.8) ----

create table public.search_log (
  id uuid primary key default gen_random_uuid(),
  term text not null,
  results integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.search_log enable row level security;
grant select on public.search_log to authenticated;
create policy search_log_admin on public.search_log for select to authenticated using (app.is_admin());

-- Anonymous view counts for "most viewed" (PRD 9.8)
alter table public.posts add column view_count integer not null default 0;

create function public.record_view(post uuid) returns void
language sql security definer set search_path = '' as $$
  update public.posts set view_count = view_count + 1 where id = post and status = 'published' and deleted_at is null
$$;

-- Layer 1 automated checks (PRD section 8) -------------------------------------

insert into public.settings (key, value) values
  ('crisis_keywords', '["kill myself", "killing myself", "suicide", "suicidal", "end my life", "end it all", "self harm", "hurt myself", "want to die", "don''t want to live", "no reason to live"]')
on conflict (key) do nothing;

-- What the checks found in a piece of text: blocked words stop it, contact
-- details and unapproved links hold it for review, crisis words publish it but
-- raise an urgent flag and show her crisis help.
create function app.screen_text(content text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  lower_text text := lower(coalesce(content, ''));
  hold text[] := '{}';
  host text;
  allowed jsonb := coalesce(app.setting('allowed_link_domains'), '[]');
begin
  if exists (
    select 1 from jsonb_array_elements_text(coalesce(app.setting('blocked_words'), '[]')) w
    where lower_text ~ ('\m' || lower(w) || '\M')
  ) then
    return jsonb_build_object('block', true);
  end if;

  if lower_text ~ '(\+?\d[\d\s().-]{8,}\d)' then hold := array_append(hold, 'phone number'); end if;
  if lower_text ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then hold := array_append(hold, 'email address'); end if;
  if lower_text ~ '(wa\.me|whatsapp|telegram|t\.me/|snapchat|instagram\.com|tiktok\.com|(^|\s)@[a-z0-9_.]{3,})' then
    hold := array_append(hold, 'contact or social handle');
  end if;
  for host in select (regexp_matches(lower_text, 'https?://(?:www\.)?([a-z0-9.-]+)', 'g'))[1]
  loop
    if not exists (
      select 1 from jsonb_array_elements_text(allowed) d where host = d or host like '%.' || d
    ) then
      hold := array_append(hold, ('link to ' || host));
    end if;
  end loop;

  return jsonb_build_object(
    'block', false,
    'hold', to_jsonb(hold),
    'crisis', exists (
      select 1 from jsonb_array_elements_text(coalesce(app.setting('crisis_keywords'), '[]')) w
      where lower_text like '%' || lower(w) || '%'
    )
  );
end;
$$;

-- Lets the app show crisis help straight after she posts. Returns only whether crisis words matched.
create function public.mentions_crisis(content text) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((app.screen_text(content) ->> 'crisis')::boolean, false)
$$;

create function app.screen_content() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  kind public.target_type := case when tg_table_name = 'posts' then 'post' else 'reply' end;
  content text := coalesce(to_jsonb(new) ->> 'title', '') || ' ' || app.rich_text_plain(new.body);
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

-- Named to run after the existing before insert triggers (triggers fire in name order)
create trigger posts_screen before insert or update of title, body on public.posts
  for each row execute function app.screen_content();
create trigger replies_screen before insert or update of body on public.replies
  for each row execute function app.screen_content();

-- Notifications (PRD 6.8) --------------------------------------------------------

create function app.notify(recipient uuid, kind text, payload jsonb) returns void
language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, kind, payload)
  select recipient, kind, payload
  where recipient is not null
    and recipient is distinct from auth.uid()
    and coalesce((select in_app from public.notification_prefs p where p.user_id = recipient and p.kind = notify.kind), true)
$$;

create function app.notify_on_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  post public.posts;
  parent_author uuid;
  info jsonb;
begin
  if new.status <> 'published' or new.deleted_at is not null then return null; end if;
  if tg_op = 'UPDATE' and old.status = 'published' then return null; end if;
  select * into post from public.posts where id = new.post_id;
  info := jsonb_build_object('post_id', post.id, 'post_title', post.title, 'reply_id', new.id);

  if new.parent_reply_id is not null then
    select author_id into parent_author from public.replies where id = new.parent_reply_id;
    perform app.notify(parent_author, 'reply_to_reply', info);
  end if;
  if post.author_id is distinct from parent_author then
    perform app.notify(post.author_id, 'reply_to_post', info);
  end if;
  perform app.notify(f.user_id, 'followed_post_reply', info)
  from public.post_follows f
  where f.post_id = post.id and f.user_id is distinct from post.author_id and f.user_id is distinct from parent_author;
  return null;
end;
$$;
create trigger replies_notify after insert or update of status on public.replies
  for each row execute function app.notify_on_reply();

create function app.notify_on_marks() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  post public.posts;
begin
  select * into post from public.posts where id = new.post_id;
  if new.is_expert_answer and not old.is_expert_answer then
    perform app.notify(post.author_id, 'expert_answered', jsonb_build_object('post_id', post.id, 'post_title', post.title, 'reply_id', new.id));
  end if;
  if new.is_helped_me and not old.is_helped_me then
    perform app.notify(new.author_id, 'helped_me', jsonb_build_object('post_id', post.id, 'post_title', post.title, 'reply_id', new.id));
  end if;
  return null;
end;
$$;
create trigger replies_notify_marks after update of is_expert_answer, is_helped_me on public.replies
  for each row execute function app.notify_on_marks();

create function public.mark_notifications_read() returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now() where user_id = auth.uid() and read_at is null
$$;

-- Author actions (PRD 6.5 and 6.6) -------------------------------------------------

create function public.delete_my_content(kind public.target_type, target uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if kind = 'post' then
    update public.posts set deleted_at = now(), deleted_by = auth.uid(), delete_reason = 'Deleted by author'
    where id = target and author_id = auth.uid() and deleted_at is null;
  elsif kind = 'reply' then
    update public.replies set deleted_at = now(), deleted_by = auth.uid(), delete_reason = 'Deleted by author'
    where id = target and author_id = auth.uid() and deleted_at is null;
  end if;
  if not found then
    raise exception 'not_yours' using errcode = '42501';
  end if;
end;
$$;

-- The person who asked can mark one member reply as Helped me
create function public.mark_helped_me(reply uuid, helped boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare
  target public.replies;
begin
  select r.* into target from public.replies r join public.posts p on p.id = r.post_id
  where r.id = reply and p.author_id = auth.uid() and r.author_id is distinct from auth.uid();
  if not found then
    raise exception 'not_yours' using errcode = '42501';
  end if;
  if helped then
    update public.replies set is_helped_me = false where post_id = target.post_id and is_helped_me and id <> reply;
  end if;
  update public.replies set is_helped_me = helped where id = reply;
end;
$$;

-- A verified expert marks her own reply as an expert answer
create function public.mark_expert_answer(reply uuid, is_answer boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.expert_profiles where user_id = auth.uid() and status = 'active') then
    raise exception 'not_expert' using errcode = '42501';
  end if;
  update public.replies set is_expert_answer = is_answer
  where id = reply and author_id = auth.uid() and deleted_at is null and parent_reply_id is null;
  if not found then
    raise exception 'not_yours' using errcode = '42501';
  end if;
end;
$$;

-- Account settings (PRD section 5) ---------------------------------------------------

-- Once every 30 days; the old name is held for 90 days
create function public.change_display_name(name text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  me public.profiles;
  clean text := regexp_replace(btrim(name), '\s+', ' ', 'g');
begin
  select * into me from public.profiles where user_id = auth.uid();
  if me.display_name_changed_at > now() - interval '30 days' then
    raise exception 'too_soon' using errcode = 'P0001';
  end if;
  case public.check_display_name(clean)
    when 'ok' then null;
    when 'taken' then raise exception 'display_name_taken' using errcode = '23505';
    else raise exception 'display_name_invalid' using errcode = '22023';
  end case;
  insert into public.display_name_history (user_id, display_name) values (me.user_id, me.display_name);
  update public.profiles set display_name = clean, display_name_changed_at = now() where user_id = me.user_id;
end;
$$;

-- Everything we hold about her, as one JSON document (PRD section 5, download my data)
create function public.export_my_data() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('email', u.email, 'created_at', u.created_at) from auth.users u where u.id = auth.uid()),
    'profile', (select to_jsonb(p) - 'id' from public.profiles p where p.user_id = auth.uid()),
    'posts', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'title', title, 'text', body_text, 'created_at', created_at, 'status', status)) from public.posts where author_id = auth.uid()), '[]'),
    'replies', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'post_id', post_id, 'text', body_text, 'created_at', created_at)) from public.replies where author_id = auth.uid()), '[]'),
    'reactions', coalesce((select jsonb_agg(jsonb_build_object('target_type', target_type, 'target_id', target_id, 'kind', kind)) from public.reactions where user_id = auth.uid()), '[]'),
    'saves', coalesce((select jsonb_agg(jsonb_build_object('target_type', target_type, 'target_id', target_id)) from public.saves where user_id = auth.uid()), '[]'),
    'spaces_followed', coalesce((select jsonb_agg(s.name) from public.space_follows f join public.spaces s on s.id = f.space_id where f.user_id = auth.uid()), '[]'),
    'reports_made', coalesce((select jsonb_agg(jsonb_build_object('target_type', target_type, 'reason', reason, 'created_at', created_at)) from public.reports where reporter_id = auth.uid()), '[]'),
    'notifications', coalesce((select jsonb_agg(jsonb_build_object('kind', kind, 'payload', payload, 'created_at', created_at)) from public.notifications where user_id = auth.uid()), '[]')
  )
$$;

-- Before her account is deleted: keep posts as "Former member" or remove them (PRD section 5)
create function public.prepare_account_deletion(remove_content boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then
    raise exception 'not_signed_in' using errcode = '28000';
  end if;
  if remove_content then
    update public.posts set deleted_at = now(), deleted_by = auth.uid(), delete_reason = 'Account deleted' where author_id = auth.uid() and deleted_at is null;
    update public.replies set deleted_at = now(), deleted_by = auth.uid(), delete_reason = 'Account deleted' where author_id = auth.uid() and deleted_at is null;
  end if;
  perform app.write_audit('delete account', 'profile', auth.uid(), null, jsonb_build_object('content_removed', remove_content));
end;
$$;

-- Search (PRD 6.7) -----------------------------------------------------------------

-- Posts whose title, body or replies match, best first or newest first, with
-- highlighted snippets. Runs as the caller, through the public views, so it
-- only ever finds what she may read. Search terms are logged with no identity.
create function public.search_posts(query text, in_space text default null, newest boolean default false, max_results integer default 30)
returns table (
  id uuid, title text, space_slug text, space_name text, space_tone public.space_tone, created_at timestamptz,
  reply_count integer, has_expert_answer boolean, author_name text, snippet text, reply_snippet text, rank real
)
language plpgsql volatile security invoker set search_path = '' as $$
declare
  q tsquery := websearch_to_tsquery('english', query);
  found_count integer;
begin
  return query
  with reply_hits as (
    select distinct on (r.post_id) r.post_id,
      ts_headline('english', app.rich_text_plain(r.body), q, 'StartSel=<<, StopSel=>>, MaxWords=24, MinWords=8') as reply_snippet,
      ts_rank(to_tsvector('english', app.rich_text_plain(r.body)), q) as rank
    from public.thread_replies r
    where not r.removed and to_tsvector('english', app.rich_text_plain(r.body)) @@ q
    order by r.post_id, rank desc
  )
  select p.id, p.title, p.space_slug, p.space_name, p.space_tone, p.created_at, p.reply_count, p.has_expert_answer, p.author_name,
    ts_headline('english', coalesce(nullif(p.body_text, ''), p.title), q, 'StartSel=<<, StopSel=>>, MaxWords=28, MinWords=10'),
    case when p.search_vector @@ q then null else h.reply_snippet end,
    (coalesce(ts_rank(p.search_vector, q), 0) + coalesce(h.rank, 0) * 0.5 + case when p.has_expert_answer then 0.05 else 0 end)::real
  from public.feed_posts p
  left join reply_hits h on h.post_id = p.id
  where (p.search_vector @@ q or h.post_id is not null)
    and (in_space is null or p.space_slug = in_space)
  order by case when newest then extract(epoch from p.created_at) else 0 end desc,
    (coalesce(ts_rank(p.search_vector, q), 0) + coalesce(h.rank, 0) * 0.5) desc
  limit max_results;

  get diagnostics found_count = row_count;
  perform app.log_search(query, found_count);
end;
$$;

create function app.log_search(term text, results integer) returns void
language sql security definer set search_path = '' as $$
  insert into public.search_log (term, results) values (left(lower(btrim(term)), 120), results)
$$;

-- Grants -------------------------------------------------------------------------

revoke all on function app.screen_text(text), app.screen_content(), app.notify(uuid, text, jsonb),
  app.notify_on_reply(), app.notify_on_marks(), app.follow_own_post(), app.log_search(text, integer) from public;
grant execute on function app.log_search(text, integer) to anon, authenticated;
revoke all on function public.record_view(uuid), public.mentions_crisis(text), public.mark_notifications_read(),
  public.delete_my_content(public.target_type, uuid), public.mark_helped_me(uuid, boolean), public.mark_expert_answer(uuid, boolean),
  public.change_display_name(text), public.export_my_data(), public.prepare_account_deletion(boolean),
  public.search_posts(text, text, boolean, integer) from public, anon, authenticated;
grant execute on function public.record_view(uuid), public.search_posts(text, text, boolean, integer) to anon, authenticated;
grant execute on function public.mentions_crisis(text), public.mark_notifications_read(), public.delete_my_content(public.target_type, uuid),
  public.mark_helped_me(uuid, boolean), public.mark_expert_answer(uuid, boolean), public.change_display_name(text),
  public.export_my_data(), public.prepare_account_deletion(boolean) to authenticated;
