-- REVIEW AND BACK UP FIRST. Run as postgres in Supabase SQL Editor.
-- Existing profiles, face_enrollments and report data are not deleted.
begin;

-- RLS limits rows, not columns. Remove direct role/email/id updates.
revoke all on public.profiles from anon;
revoke insert, update, delete, truncate, references, trigger on public.profiles from authenticated;
-- Clear any older column-level grants as well.
do $$ declare c record; begin
  for c in select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles'
  loop
    execute format('revoke insert (%I), update (%I), references (%I) on public.profiles from authenticated', c.column_name, c.column_name, c.column_name);
  end loop;
end $$;
grant select on public.profiles to authenticated;
grant update (full_name, phone, student_id, avatar_url, face_auth_enabled, updated_at)
  on public.profiles to authenticated;
revoke all on public.face_enrollments from anon;
revoke truncate, references, trigger on public.face_enrollments from authenticated;

-- Retire direct access to old role-changing RPC overloads. Keep their definitions
-- for rollback/reference. The supplied admin route uses the new RPC below.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'admin_update_user_role'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.signature);
  end loop;
end $$;

create or replace function public.safespace_set_user_role(target_user_id uuid, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then raise exception 'Forbidden'; end if;
  if new_role not in ('student','teacher','counselor','admin') then raise exception 'Invalid role'; end if;
  if target_user_id = auth.uid() then raise exception 'Cannot change your own role'; end if;
  update public.profiles set role = new_role, updated_at = now() where id = target_user_id;
  if not found then raise exception 'User not found'; end if;
end $$;
revoke all on function public.safespace_set_user_role(uuid,text) from public, anon;
grant execute on function public.safespace_set_user_role(uuid,text) to authenticated;

-- Only manually approved pilot accounts can opt in. No browser write policies.
create table if not exists public.face_login_pilot_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved_at timestamptz not null default now()
);
create table if not exists public.face_login_credentials (
  user_id uuid primary key references auth.users(id) on delete cascade,
  version uuid not null default gen_random_uuid(),
  encrypted_template text not null,
  identity_stamp text not null,
  model text not null check (model = 'human-3.3.6-faceres-wasm-v1'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.face_login_attempts (
  id uuid primary key,
  user_id uuid references auth.users(id) on delete cascade,
  purpose text not null check (purpose in ('login','enroll')),
  binding_hash text not null,
  prompts jsonb not null check (jsonb_array_length(prompts) = 5),
  step integer not null default 0 check (step between 0 and 5),
  busy boolean not null default false,
  finished boolean not null default false,
  encrypted_state text not null,
  credential_version uuid,
  identity_stamp text,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists face_login_attempt_expiry on public.face_login_attempts(expires_at);
create table if not exists public.face_login_limits (
  key text primary key,
  count integer not null,
  expires_at timestamptz not null
);
create table if not exists public.face_login_frame_uses (
  hash text primary key,
  expires_at timestamptz not null default (now() + interval '1 day')
);

alter table public.face_login_pilot_accounts enable row level security;
alter table public.face_login_credentials enable row level security;
alter table public.face_login_attempts enable row level security;
alter table public.face_login_limits enable row level security;
alter table public.face_login_frame_uses enable row level security;
revoke all on public.face_login_pilot_accounts, public.face_login_credentials,
  public.face_login_attempts, public.face_login_limits, public.face_login_frame_uses from public, anon, authenticated;
grant all on public.face_login_pilot_accounts, public.face_login_credentials,
  public.face_login_attempts, public.face_login_limits, public.face_login_frame_uses to service_role;

-- Canonical account lookup, not profiles.email or user-editable metadata.
-- Stamp changes invalidate credentials after password/email changes.
create or replace function public.face_login_account(p_email text)
returns table(user_id uuid, identity_stamp text) language sql security definer set search_path = '' as $$
  select u.id, md5(coalesce(u.encrypted_password,'') || ':' || lower(u.email))
  from auth.users u
  join public.profiles p on p.id = u.id and p.role = 'student'
  join public.face_login_pilot_accounts a on a.user_id = u.id
  where lower(u.email) = lower(p_email) and u.email_confirmed_at is not null
    and coalesce(u.encrypted_password,'') <> ''
    and (u.banned_until is null or u.banned_until < now())
    and not exists (select 1 from auth.mfa_factors f where f.user_id = u.id and f.status = 'verified')
  limit 1;
$$;

-- Persisted fixed-window limiter. Called before password checks and inference.
create or replace function public.face_login_take_limit(p_key text, p_limit int, p_seconds int)
returns boolean language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if p_limit < 1 or p_limit > 1000 or p_seconds < 1 or p_seconds > 86400 then raise exception 'Bad limit'; end if;
  insert into public.face_login_limits as l (key,count,expires_at)
  values (p_key,1,now()+make_interval(secs=>p_seconds))
  on conflict (key) do update set
    count = case when l.expires_at <= now() then 1 else least(l.count+1,1001) end,
    expires_at = case when l.expires_at <= now() then now()+make_interval(secs=>p_seconds) else l.expires_at end
  returning count into n;
  return n <= p_limit;
end $$;

-- Atomic claim: exactly one worker can process a given challenge step.
-- Crashed/failed claims cannot be replayed; user starts a fresh attempt.
create or replace function public.face_login_claim(p_id uuid, p_binding text, p_step int)
returns setof public.face_login_attempts language sql security definer set search_path = '' as $$
  update public.face_login_attempts set busy = true
  where id = p_id and binding_hash = p_binding and step = p_step
    and not busy and not finished and expires_at > now() and step < 5
  returning *;
$$;

-- Cleanup can also be scheduled daily. Never removes unexpired challenges.
create or replace function public.face_login_cleanup()
returns void language sql security definer set search_path = '' as $$
  delete from public.face_login_attempts where expires_at < now();
  delete from public.face_login_limits where expires_at < now() - interval '1 day';
  delete from public.face_login_frame_uses where expires_at < now();
$$;

revoke all on function public.face_login_account(text) from public, anon, authenticated;
revoke all on function public.face_login_take_limit(text,int,int) from public, anon, authenticated;
revoke all on function public.face_login_claim(uuid,text,int) from public, anon, authenticated;
revoke all on function public.face_login_cleanup() from public, anon, authenticated;
grant execute on function public.face_login_account(text), public.face_login_take_limit(text,int,int),
  public.face_login_claim(uuid,text,int), public.face_login_cleanup() to service_role;
commit;

-- No one is enabled automatically. After reviewing accounts/roles, add a TEST
-- student UUID manually (never use user-supplied metadata for approval):
-- insert into public.face_login_pilot_accounts(user_id) values ('ACTUAL-TEST-USER-UUID');
-- Disable that account immediately:
-- delete from public.face_login_pilot_accounts where user_id = 'ACTUAL-TEST-USER-UUID';
