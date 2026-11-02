-- Grants, row level security and public views (PRD sections 3, 10 and 13).
--
-- Model:
-- * Base tables are readable only by their owner and by staff. Writes use
--   column grants, so members can never set status, role, counts or flags.
-- * Public reads go through views that expose safe columns only and resolve
--   anonymous and team authors to a label. Views run as their owner, so their
--   WHERE clauses carry the visibility rules: published, not deleted, and in a
--   space the viewer may see.
-- * Staff actions that change other people's content go through security
--   definer functions that also write the audit log.

-- Start from nothing: Supabase grants everything on public tables to the API roles by default.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
revoke all on all functions in schema app from public, anon, authenticated;

grant usage on schema app to anon, authenticated;
grant execute on function
  app.viewer_role(), app.is_staff(), app.is_admin(), app.is_super_admin(), app.age_from_birth_year(integer),
  app.viewer_age(), app.can_view_space(uuid), app.can_view_post(uuid), app.can_view_target(public.target_type, uuid),
  app.can_participate(), app.can_act(), app.rich_text_plain(jsonb)
to anon, authenticated;

grant execute on function public.check_display_name(text) to authenticated;
grant execute on function public.complete_onboarding(text, integer, text[], boolean) to authenticated;
grant execute on function public.custom_access_token_hook(jsonb) to supabase_auth_admin;
grant usage on schema public to supabase_auth_admin;
grant select on public.profiles to supabase_auth_admin;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end;
$$;

-- Members ---------------------------------------------------------------------

grant select, update (hide_activity, last_active_at) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (user_id = auth.uid() or app.is_staff());
create policy profiles_update_self on public.profiles for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy profiles_auth_hook on public.profiles for select to supabase_auth_admin using (true);

-- display_name_history: no API access.

-- Experts ---------------------------------------------------------------------

grant select, update (bio, photo_url, available) on public.expert_profiles to authenticated;
create policy expert_profiles_select on public.expert_profiles for select to authenticated
  using (user_id = auth.uid() or app.is_admin());
create policy expert_profiles_update_self on public.expert_profiles for update to authenticated
  using (user_id = auth.uid() and status = 'active') with check (user_id = auth.uid());

grant select on public.expert_invites to authenticated;
create policy expert_invites_admin on public.expert_invites for select to authenticated using (app.is_admin());

grant select, insert (
  user_id, legal_name, title, category, category_other, specialties, licensing_body, licence_number,
  country, years_in_practice, workplace, profile_url, bio, document_paths
) on public.expert_applications to authenticated;
create policy expert_applications_select on public.expert_applications for select to authenticated
  using (user_id = auth.uid() or app.is_admin());
create policy expert_applications_insert on public.expert_applications for insert to authenticated
  with check (
    user_id = auth.uid()
    and app.can_act()
    and not exists (
      select 1 from public.expert_applications a
      where a.user_id = auth.uid() and a.status in ('submitted', 'in_review', 'more_info')
    )
  );

-- Spaces ----------------------------------------------------------------------

grant select on public.spaces to anon, authenticated;
grant insert, update on public.spaces to authenticated;
create policy spaces_select on public.spaces for select to anon, authenticated using (app.can_view_space(id));
create policy spaces_admin_insert on public.spaces for insert to authenticated with check (app.is_admin());
create policy spaces_admin_update on public.spaces for update to authenticated using (app.is_admin()) with check (app.is_admin());

grant select, insert, delete on public.space_moderators to authenticated;
create policy space_moderators_select on public.space_moderators for select to authenticated using (app.is_staff());
create policy space_moderators_admin_insert on public.space_moderators for insert to authenticated with check (app.is_admin());
create policy space_moderators_admin_delete on public.space_moderators for delete to authenticated using (app.is_admin());

grant select, insert (space_id, user_id), delete on public.space_follows to authenticated;
create policy space_follows_select on public.space_follows for select to authenticated using (user_id = auth.uid());
create policy space_follows_insert on public.space_follows for insert to authenticated
  with check (user_id = auth.uid() and app.can_act() and app.can_view_space(space_id));
create policy space_follows_delete on public.space_follows for delete to authenticated using (user_id = auth.uid());

-- Content ---------------------------------------------------------------------

grant select,
  insert (author_id, space_id, type, title, body, tags, content_warning, ask_expert, fully_anonymous, as_team),
  update (title, body, tags, content_warning)
on public.posts to authenticated;
create policy posts_select on public.posts for select to authenticated
  using (author_id = auth.uid() or app.is_staff());
create policy posts_insert on public.posts for insert to authenticated
  with check (
    author_id = auth.uid()
    and app.can_participate()
    and app.can_view_space(space_id)
    and (not as_team or app.is_admin())
    and (type <> 'announcement' or app.is_admin())
  );
create policy posts_update_own on public.posts for update to authenticated
  using (author_id = auth.uid() and deleted_at is null) with check (author_id = auth.uid());

grant select,
  insert (post_id, parent_reply_id, author_id, body, as_team),
  update (body)
on public.replies to authenticated;
create policy replies_select on public.replies for select to authenticated
  using (author_id = auth.uid() or app.is_staff());
create policy replies_insert on public.replies for insert to authenticated
  with check (
    author_id = auth.uid()
    and app.can_participate()
    and app.can_view_post(post_id)
    and (not as_team or app.is_admin())
  );
create policy replies_update_own on public.replies for update to authenticated
  using (author_id = auth.uid() and deleted_at is null) with check (author_id = auth.uid());

grant select, insert (target_type, target_id, user_id, kind), delete on public.reactions to authenticated;
create policy reactions_select on public.reactions for select to authenticated using (user_id = auth.uid());
create policy reactions_insert on public.reactions for insert to authenticated
  with check (user_id = auth.uid() and app.can_act() and app.can_view_target(target_type, target_id));
create policy reactions_delete on public.reactions for delete to authenticated using (user_id = auth.uid());

grant select, insert (user_id, target_type, target_id), delete on public.saves to authenticated;
create policy saves_select on public.saves for select to authenticated using (user_id = auth.uid());
create policy saves_insert on public.saves for insert to authenticated
  with check (user_id = auth.uid() and app.can_act() and app.can_view_target(target_type, target_id));
create policy saves_delete on public.saves for delete to authenticated using (user_id = auth.uid());

-- Moderation ------------------------------------------------------------------

grant select, insert (target_type, target_id, reporter_id, reason, note) on public.reports to authenticated;
create policy reports_select on public.reports for select to authenticated
  using (reporter_id = auth.uid() or app.is_staff());
create policy reports_insert on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and app.can_act() and app.can_view_target(target_type, target_id));

grant select on public.moderation_flags, public.moderation_actions to authenticated;
create policy moderation_flags_staff on public.moderation_flags for select to authenticated using (app.is_staff());
create policy moderation_actions_staff on public.moderation_actions for select to authenticated using (app.is_staff());

grant select on public.member_sanctions to authenticated;
create policy member_sanctions_select on public.member_sanctions for select to authenticated
  using (user_id = auth.uid() or app.is_staff());

-- Notifications -----------------------------------------------------------------

grant select, update (read_at) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert (user_id, kind, in_app, email), update (in_app, email) on public.notification_prefs to authenticated;
create policy notification_prefs_select on public.notification_prefs for select to authenticated using (user_id = auth.uid());
create policy notification_prefs_insert on public.notification_prefs for insert to authenticated with check (user_id = auth.uid());
create policy notification_prefs_update on public.notification_prefs for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Platform ----------------------------------------------------------------------

grant select on public.announcements to anon, authenticated;
grant insert, update, delete on public.announcements to authenticated;
create policy announcements_select on public.announcements for select to anon, authenticated
  using (
    app.is_admin()
    or (starts_at <= now() and (ends_at is null or ends_at > now()) and (space_id is null or app.can_view_space(space_id)))
  );
create policy announcements_admin_insert on public.announcements for insert to authenticated with check (app.is_admin());
create policy announcements_admin_update on public.announcements for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy announcements_admin_delete on public.announcements for delete to authenticated using (app.is_admin());

-- Crisis resources are public; every other setting (blocked words, thresholds) is admin only.
grant select on public.settings to anon, authenticated;
grant insert, update on public.settings to authenticated;
create policy settings_select on public.settings for select to anon, authenticated
  using (key = 'crisis_resources' or app.is_admin());
create policy settings_admin_insert on public.settings for insert to authenticated with check (app.is_admin());
create policy settings_admin_update on public.settings for update to authenticated using (app.is_admin()) with check (app.is_admin());

grant select on public.audit_log, public.pii_access_log to authenticated;
create policy audit_log_admin on public.audit_log for select to authenticated using (app.is_admin());
create policy pii_access_log_admin on public.pii_access_log for select to authenticated using (app.is_admin());

-- Public views ------------------------------------------------------------------

-- Display name, initial and joined month only (PRD section 5, profile visibility).
create view public.public_profiles with (security_barrier = true) as
select
  p.user_id,
  p.display_name,
  p.role = 'expert' as is_expert,
  date_trunc('month', p.created_at)::date as joined_month,
  p.hide_activity
from public.profiles p
where p.onboarding_complete and p.status <> 'banned';

create view public.public_experts with (security_barrier = true) as
select
  e.user_id, e.handle, e.public_name, e.title, e.category, e.category_other, e.specialties,
  e.licensing_body, e.country, e.bio, e.photo_url, e.available, e.verified_at
from public.expert_profiles e
join public.profiles p on p.user_id = e.user_id
where e.status = 'active' and p.status <> 'banned';

create view public.feed_posts with (security_barrier = true) as
select
  p.id,
  p.space_id,
  s.slug as space_slug,
  s.name as space_name,
  s.accent_color as space_tone,
  p.type,
  p.title,
  p.body,
  p.body_text,
  p.tags,
  p.content_warning,
  p.ask_expert,
  p.pinned,
  p.locked,
  p.edited_at,
  p.reply_count,
  p.reaction_counts,
  p.has_expert_answer,
  p.search_vector,
  p.created_at,
  case
    when p.as_team then 'MeridianHer Team'
    when p.fully_anonymous then 'Anonymous member'
    when pr.display_name is null then 'Former member'
    else pr.display_name
  end as author_name,
  case when p.as_team or p.fully_anonymous then null else p.author_id end as author_user_id,
  p.as_team,
  p.fully_anonymous,
  p.author_id is not distinct from auth.uid() as is_mine
from public.posts p
join public.spaces s on s.id = p.space_id
left join public.profiles pr on pr.user_id = p.author_id
where p.status = 'published' and p.deleted_at is null and app.can_view_space(p.space_id);

-- Every reply on a visible post. Removed replies stay as placeholders so threads
-- keep their shape, with the body and author cleared. Held replies are not shown.
create view public.thread_replies with (security_barrier = true) as
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
    when r.author_role_snapshot = 'expert' and e.public_name is not null then e.public_name
    when pr.display_name is null then 'Former member'
    else pr.display_name
  end as author_name,
  case when r.as_team or r.status <> 'published' or r.deleted_at is not null then null else r.author_id end as author_user_id,
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
left join public.profiles pr on pr.user_id = r.author_id
left join public.expert_profiles e on e.user_id = r.author_id
where r.status <> 'held' and app.can_view_post(r.post_id);

grant select on public.public_profiles, public.public_experts, public.feed_posts, public.thread_replies to anon, authenticated;
