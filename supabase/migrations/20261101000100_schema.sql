-- MeridianHer Community schema (PRD section 10).
-- Every table has id, created_at, updated_at. Content tables soft delete.
-- Row level security is enabled in 20261101000300_rls.sql.

-- Private helpers live in `app`, which PostgREST does not expose.
create schema if not exists app;

-- Enums ---------------------------------------------------------------------

create type public.app_role as enum ('member', 'expert', 'moderator', 'admin', 'super_admin');
create type public.member_status as enum ('active', 'muted', 'banned');
create type public.post_type as enum ('question', 'discussion', 'announcement');
create type public.content_status as enum ('published', 'held', 'hidden');
create type public.content_warning as enum ('pregnancy_loss', 'graphic', 'mental_health');
create type public.target_type as enum ('post', 'reply', 'profile');
create type public.reaction_kind as enum ('hug', 'same', 'helpful');
create type public.report_reason as enum ('harassment', 'misinformation', 'selling', 'privacy', 'self_harm', 'sexual', 'other');
create type public.report_status as enum ('open', 'claimed', 'resolved');
create type public.flag_source as enum ('classifier', 'keyword', 'new_account', 'link', 'threshold');
create type public.flag_priority as enum ('urgent', 'normal');
create type public.expert_category as enum (
  'gp', 'gynaecologist', 'midwife', 'fertility_specialist', 'dietitian', 'nutritionist',
  'therapist', 'pelvic_physio', 'pharmacist', 'other'
);
create type public.expert_status as enum ('active', 'suspended', 'revoked');
create type public.application_source as enum ('applied', 'invited');
create type public.application_status as enum ('submitted', 'in_review', 'more_info', 'approved', 'rejected');
create type public.sanction_kind as enum ('warn', 'mute', 'ban');
create type public.appeal_status as enum ('pending', 'upheld', 'overturned');
create type public.email_frequency as enum ('off', 'immediate', 'digest');
create type public.space_tone as enum (
  'periods', 'fertility', 'pregnancy', 'postpartum', 'menopause', 'conditions', 'sexual', 'mind', 'nutrition', 'body'
);

-- Shared ---------------------------------------------------------------------

create function app.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Plain text of a Tiptap JSON document, for search and previews.
create function app.rich_text_plain(doc jsonb) returns text
language sql immutable parallel safe as $$
  select coalesce(
    (select string_agg(t #>> '{}', ' ') from jsonb_array_elements(jsonb_path_query_array(doc, 'strict $.**.text')) t),
    ''
  )
$$;

-- Members --------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  display_name text check (display_name ~ '^[[:alpha:]][[:alpha:] ]{1,28}[[:alpha:]]$'),
  display_name_changed_at timestamptz,
  birth_year smallint check (birth_year between 1900 and 2100),
  role public.app_role not null default 'member',
  status public.member_status not null default 'active',
  muted_until timestamptz,
  onboarding_complete boolean not null default false,
  guidelines_accepted_at timestamptz,
  hide_activity boolean not null default false,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_display_name_key on public.profiles (lower(display_name));

-- Old display names are held for 90 days so nobody else can take them.
create table public.display_name_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  display_name text not null,
  released_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index display_name_history_name_idx on public.display_name_history (lower(display_name), released_at);

-- Experts --------------------------------------------------------------------

create table public.expert_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (user_id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  public_name text not null check (char_length(public_name) between 2 and 80),
  legal_name text not null,
  title text not null,
  category public.expert_category not null,
  category_other text,
  specialties text[] not null default '{}' check (cardinality(specialties) <= 3),
  licensing_body text not null,
  licence_number text not null,
  country text not null,
  bio text check (char_length(bio) <= 300),
  photo_url text,
  available boolean not null default true,
  verified_at timestamptz not null,
  renewal_due timestamptz not null,
  status public.expert_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expert_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  category public.expert_category not null,
  token_hash text not null unique,
  invited_by uuid references public.profiles (user_id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.expert_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  source public.application_source not null default 'applied',
  invite_id uuid references public.expert_invites (id) on delete set null,
  legal_name text not null,
  title text not null,
  category public.expert_category not null,
  category_other text,
  specialties text[] not null default '{}' check (cardinality(specialties) between 1 and 3),
  licensing_body text not null,
  licence_number text not null,
  country text not null,
  years_in_practice smallint not null check (years_in_practice between 0 and 70),
  workplace text,
  profile_url text not null,
  bio text not null check (char_length(bio) <= 300),
  document_paths text[] not null default '{}',
  consent_at timestamptz not null default now(),
  status public.application_status not null default 'submitted',
  reviewer_id uuid references public.profiles (user_id) on delete set null,
  decision_reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index expert_applications_status_idx on public.expert_applications (status, created_at);

-- Spaces ---------------------------------------------------------------------

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,40}$'),
  name text not null,
  description text not null,
  icon text not null,
  accent_color public.space_tone not null,
  rules text[] not null default '{}' check (cardinality(rules) <= 5),
  tags text[] not null default '{}',
  min_age smallint check (min_age between 16 and 21),
  ask_expert_enabled boolean not null default false,
  show_crisis_card boolean not null default false,
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.space_moderators (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, user_id)
);

create table public.space_follows (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references public.spaces (id) on delete cascade,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (space_id, user_id)
);
create index space_follows_user_idx on public.space_follows (user_id);

-- Content --------------------------------------------------------------------

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (user_id) on delete set null,
  space_id uuid not null references public.spaces (id),
  type public.post_type not null default 'question',
  title text not null check (char_length(title) between 10 and 150),
  body jsonb,
  body_text text generated always as (app.rich_text_plain(body)) stored check (char_length(body_text) <= 5000),
  tags text[] not null default '{}' check (cardinality(tags) <= 3),
  content_warning public.content_warning,
  ask_expert boolean not null default false,
  fully_anonymous boolean not null default false,
  as_team boolean not null default false,
  status public.content_status not null default 'published',
  pinned boolean not null default false,
  locked boolean not null default false,
  edited_at timestamptz,
  reply_count integer not null default 0,
  reaction_counts jsonb not null default '{"hug": 0, "same": 0, "helpful": 0}',
  has_expert_answer boolean not null default false,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', title), 'A') || setweight(to_tsvector('english', app.rich_text_plain(body)), 'B')
  ) stored,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (user_id) on delete set null,
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_feed_idx on public.posts (space_id, created_at desc) where status = 'published' and deleted_at is null;
create index posts_author_idx on public.posts (author_id, created_at desc);
create index posts_search_idx on public.posts using gin (search_vector);

create table public.replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  parent_reply_id uuid references public.replies (id) on delete cascade,
  author_id uuid references public.profiles (user_id) on delete set null,
  body jsonb not null,
  body_text text generated always as (app.rich_text_plain(body)) stored check (char_length(body_text) between 1 and 5000),
  author_role_snapshot public.app_role not null default 'member',
  expert_category_snapshot public.expert_category,
  is_expert_answer boolean not null default false,
  is_helped_me boolean not null default false,
  as_team boolean not null default false,
  status public.content_status not null default 'published',
  edited_at timestamptz,
  reaction_counts jsonb not null default '{"hug": 0, "same": 0, "helpful": 0}',
  search_vector tsvector generated always as (to_tsvector('english', app.rich_text_plain(body))) stored,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (user_id) on delete set null,
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index replies_post_idx on public.replies (post_id, created_at);
create index replies_author_idx on public.replies (author_id, created_at desc);
create index replies_search_idx on public.replies using gin (search_vector);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  target_type public.target_type not null check (target_type in ('post', 'reply')),
  target_id uuid not null,
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind public.reaction_kind not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_type, target_id, kind)
);
create index reactions_target_idx on public.reactions (target_type, target_id);

create table public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  target_type public.target_type not null check (target_type in ('post', 'reply')),
  target_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

-- Moderation -----------------------------------------------------------------

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  target_type public.target_type not null,
  target_id uuid not null,
  reporter_id uuid references public.profiles (user_id) on delete set null,
  reason public.report_reason not null,
  note text check (char_length(note) <= 500),
  status public.report_status not null default 'open',
  claimed_by uuid references public.profiles (user_id) on delete set null,
  claimed_at timestamptz,
  resolution text,
  resolved_by uuid references public.profiles (user_id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reporter_id, target_type, target_id)
);
create index reports_queue_idx on public.reports (status, created_at);
create index reports_target_idx on public.reports (target_type, target_id);

create table public.moderation_flags (
  id uuid primary key default gen_random_uuid(),
  target_type public.target_type not null,
  target_id uuid not null,
  source public.flag_source not null,
  score numeric(4, 3),
  details jsonb not null default '{}',
  priority public.flag_priority not null default 'normal',
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index moderation_flags_open_idx on public.moderation_flags (priority, created_at) where resolved_at is null;

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references public.profiles (user_id) on delete set null,
  target_type public.target_type not null,
  target_id uuid not null,
  action text not null,
  reason_code text,
  reason_text text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index moderation_actions_target_idx on public.moderation_actions (target_type, target_id);

create table public.member_sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind public.sanction_kind not null,
  until timestamptz,
  reason text not null,
  issued_by uuid references public.profiles (user_id) on delete set null,
  appeal_text text,
  appeal_status public.appeal_status,
  appealed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index member_sanctions_user_idx on public.member_sanctions (user_id, created_at desc);

-- Notifications --------------------------------------------------------------

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind text not null,
  payload jsonb not null default '{}',
  read_at timestamptz,
  emailed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.notification_prefs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (user_id) on delete cascade,
  kind text not null,
  in_app boolean not null default true,
  email public.email_frequency not null default 'digest',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, kind)
);

-- Platform -------------------------------------------------------------------

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles (user_id) on delete set null,
  space_id uuid references public.spaces (id) on delete cascade,
  body text not null,
  banner boolean not null default false,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append only. No role is granted update or delete, and a trigger rejects both.
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (user_id) on delete set null,
  action text not null,
  target_type text,
  target_id uuid,
  before jsonb,
  after jsonb,
  reason text,
  ip inet,
  at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index audit_log_at_idx on public.audit_log (at desc);

create table public.pii_access_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles (user_id) on delete set null,
  member_id uuid references public.profiles (user_id) on delete set null,
  field text not null,
  reason text not null check (char_length(reason) >= 5),
  at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at on every table
do $$
declare t text;
begin
  for t in
    select table_name from information_schema.tables
    where table_schema = 'public' and table_type = 'BASE TABLE'
  loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function app.set_updated_at()', t);
  end loop;
end;
$$;
