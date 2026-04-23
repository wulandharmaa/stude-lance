-- USERS: tambah field untuk approval akun + email verified mirror
alter table public.users
  add column if not exists email_verified_at timestamptz null,
  add column if not exists is_active boolean not null default false,
  add column if not exists account_status text not null default 'pending',
  add column if not exists account_rejection_reason text null,
  add column if not exists approved_by uuid null references public.users(id) on delete set null,
  add column if not exists approved_at timestamptz null;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'users_account_status_check'
  ) then
    alter table public.users
      add constraint users_account_status_check
      check (account_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

-- STUDENT_VERIFICATIONS
create table if not exists public.student_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  ktm_image text not null,
  status text not null default 'pending',
  rejection_reason text null,
  verified_by uuid null references public.users(id) on delete set null,
  verified_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'student_verifications_status_check'
  ) then
    alter table public.student_verifications
      add constraint student_verifications_status_check
      check (status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create index if not exists idx_student_verifications_user_id
  on public.student_verifications(user_id);

create index if not exists idx_student_verifications_status
  on public.student_verifications(status);

-- bucket private untuk KTM
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ktm-images', 'ktm-images', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- sync auth.users -> public.users (tanpa simpan password di public.users)
create or replace function public.sync_auth_user_to_public_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role, email_verified_at, is_active, account_status, is_student_verified)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.email_confirmed_at,
    false,
    'pending',
    false
  )
  on conflict (id) do update
    set email = excluded.email,
        email_verified_at = excluded.email_verified_at;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_sync_public on auth.users;
create trigger on_auth_user_created_sync_public
after insert on auth.users
for each row execute function public.sync_auth_user_to_public_users();

drop trigger if exists on_auth_user_updated_sync_public on auth.users;
create trigger on_auth_user_updated_sync_public
after update of email, email_confirmed_at on auth.users
for each row execute function public.sync_auth_user_to_public_users();

-- RLS
alter table public.student_verifications enable row level security;

drop policy if exists "student_verifications_select_own_or_admin" on public.student_verifications;
create policy "student_verifications_select_own_or_admin"
on public.student_verifications
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

drop policy if exists "student_verifications_insert_own" on public.student_verifications;
create policy "student_verifications_insert_own"
on public.student_verifications
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "student_verifications_update_admin_only" on public.student_verifications;
create policy "student_verifications_update_admin_only"
on public.student_verifications
for update
to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);