alter table public.users
  add column if not exists city text null,
  add column if not exists university_name text null,
  add column if not exists major text null,
  add column if not exists about text null,
  add column if not exists skills text[] not null default '{}'::text[],
  add column if not exists avatar_url text null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'users_role_check'
  ) then
    alter table public.users drop constraint users_role_check;
  end if;

  alter table public.users
    add constraint users_role_check
    check (role in ('admin', 'student', 'client'));
end $$;

alter table public.projects
  add column if not exists description text null,
  add column if not exists budget numeric(12,2) not null default 0,
  add column if not exists city text null,
  add column if not exists category text null,
  add column if not exists deadline date null;

alter table public.milestones
  add column if not exists description text null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'milestones_status_check'
  ) then
    alter table public.milestones drop constraint milestones_status_check;
  end if;

  alter table public.milestones
    add constraint milestones_status_check
    check (status in ('pending', 'funded', 'working', 'approved', 'paid'));
end $$;

alter table public.payments
  add column if not exists project_id uuid null references public.projects(id) on delete cascade,
  add column if not exists platform_fee numeric(12,2) not null default 0,
  add column if not exists notes text null;

update public.payments p
set project_id = m.project_id
from public.milestones m
where p.milestone_id = m.id
  and p.project_id is null;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'payments_status_check'
  ) then
    alter table public.payments drop constraint payments_status_check;
  end if;

  alter table public.payments
    add constraint payments_status_check
    check (status in ('pending', 'approved', 'paid', 'failed'));
end $$;

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null check (role in ('client', 'student', 'mentor', 'admin')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  proposal text not null,
  proposed_budget numeric(12,2) null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, student_id)
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'project_applications_status_check'
  ) then
    alter table public.project_applications
      add constraint project_applications_status_check
      check (status in ('pending', 'accepted', 'rejected'));
  end if;
end $$;

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploader_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_size bigint not null default 0,
  mime_type text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_city on public.projects(city);
create index if not exists idx_projects_category on public.projects(category);
create index if not exists idx_projects_deadline on public.projects(deadline);
create index if not exists idx_payments_project_id on public.payments(project_id);
create index if not exists idx_project_members_project_id on public.project_members(project_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_project_applications_project_id on public.project_applications(project_id);
create index if not exists idx_project_applications_student_id on public.project_applications(student_id);
create index if not exists idx_project_applications_status on public.project_applications(status);
create index if not exists idx_project_files_project_id on public.project_files(project_id);

insert into storage.buckets (id, name, public, file_size_limit)
values ('project-files', 'project-files', false, 10485760)
on conflict (id) do nothing;

insert into public.project_members (project_id, user_id, role)
select p.id, p.client_id, 'client'
from public.projects p
where p.client_id is not null
on conflict (project_id, user_id) do nothing;

insert into public.project_members (project_id, user_id, role)
select p.id, p.student_id, 'student'
from public.projects p
where p.student_id is not null
on conflict (project_id, user_id) do nothing;

create or replace function public.sync_auth_user_to_public_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text;
  is_client boolean;
begin
  requested_role := coalesce(new.raw_user_meta_data->>'role', 'client');
  is_client := requested_role = 'client';

  insert into public.users (
    id,
    email,
    full_name,
    role,
    email_verified_at,
    is_active,
    account_status,
    is_student_verified,
    city,
    university_name,
    major,
    about,
    skills,
    avatar_url,
    approved_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    requested_role,
    new.email_confirmed_at,
    case when is_client then true else false end,
    case when is_client then 'approved' else 'pending' end,
    false,
    nullif(new.raw_user_meta_data->>'city', ''),
    nullif(new.raw_user_meta_data->>'university_name', ''),
    nullif(new.raw_user_meta_data->>'major', ''),
    nullif(new.raw_user_meta_data->>'about', ''),
    case
      when jsonb_typeof(new.raw_user_meta_data->'skills') = 'array'
        then array(select jsonb_array_elements_text(new.raw_user_meta_data->'skills'))
      else '{}'::text[]
    end,
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    case when is_client then now() else null end
  )
  on conflict (id) do update
    set email = excluded.email,
        email_verified_at = excluded.email_verified_at;

  return new;
end;
$$;

alter table public.project_members enable row level security;
alter table public.project_applications enable row level security;
alter table public.project_files enable row level security;

drop policy if exists "project_members_select_project_member" on public.project_members;
create policy "project_members_select_project_member"
on public.project_members
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and (
        p.client_id = auth.uid()
        or p.student_id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid() and u.role = 'admin'
        )
      )
  )
);

drop policy if exists "project_members_write_client_or_admin" on public.project_members;
create policy "project_members_write_client_or_admin"
on public.project_members
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and (
        p.client_id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid() and u.role = 'admin'
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and (
        p.client_id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid() and u.role = 'admin'
        )
      )
  )
);

drop policy if exists "project_applications_select_visibility" on public.project_applications;
create policy "project_applications_select_visibility"
on public.project_applications
for select
to authenticated
using (
  student_id = auth.uid()
  or exists (
    select 1
    from public.projects p
    where p.id = project_applications.project_id
      and (
        p.client_id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid() and u.role = 'admin'
        )
      )
  )
);

drop policy if exists "project_applications_insert_student_only" on public.project_applications;
create policy "project_applications_insert_student_only"
on public.project_applications
for insert
to authenticated
with check (student_id = auth.uid());

drop policy if exists "project_applications_update_client_or_admin" on public.project_applications;
create policy "project_applications_update_client_or_admin"
on public.project_applications
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_applications.project_id
      and (
        p.client_id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid() and u.role = 'admin'
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_applications.project_id
      and (
        p.client_id = auth.uid()
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid() and u.role = 'admin'
        )
      )
  )
);

drop policy if exists "project_files_select_project_member" on public.project_files;
create policy "project_files_select_project_member"
on public.project_files
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_files.project_id
      and (
        p.client_id = auth.uid()
        or p.student_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = project_files.project_id
            and pm.user_id = auth.uid()
        )
        or exists (
          select 1
          from public.users u
          where u.id = auth.uid() and u.role = 'admin'
        )
      )
  )
);

drop policy if exists "project_files_insert_project_member" on public.project_files;
create policy "project_files_insert_project_member"
on public.project_files
for insert
to authenticated
with check (
  uploader_id = auth.uid()
  and exists (
    select 1
    from public.projects p
    where p.id = project_files.project_id
      and (
        p.client_id = auth.uid()
        or p.student_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = project_files.project_id
            and pm.user_id = auth.uid()
        )
      )
  )
);
