create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  role text not null check (role in ('student', 'client')),
  ktm_image_url text,
  is_student_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete cascade,
  student_id uuid references public.users(id) on delete set null,
  title text not null,
  status text not null check (status in ('open', 'in_progress', 'completed')) default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date,
  status text not null check (status in ('pending', 'working', 'approved')) default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references public.milestones(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  type text not null check (type in ('academic', 'exam', 'project_deadline')),
  start_time timestamptz not null,
  end_time timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_projects_client_id on public.projects(client_id);
create index if not exists idx_projects_student_id on public.projects(student_id);
create index if not exists idx_milestones_project_id on public.milestones(project_id);
create index if not exists idx_payments_milestone_id on public.payments(milestone_id);
create index if not exists idx_schedules_user_id on public.schedules(user_id);
create index if not exists idx_schedules_project_id on public.schedules(project_id);
create index if not exists idx_messages_project_id on public.messages(project_id);