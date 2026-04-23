create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.users(id) on delete cascade,
  action text not null,
  target_type text not null,
  target_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_admin_audit_logs_admin_id on public.admin_audit_logs(admin_id);
create index if not exists idx_admin_audit_logs_target on public.admin_audit_logs(target_type, target_id);

-- 1 user hanya boleh punya 1 pengajuan pending aktif
create unique index if not exists uq_student_verification_pending_per_user
on public.student_verifications(user_id)
where status = 'pending';

alter table public.admin_audit_logs enable row level security;

drop policy if exists "admin_audit_logs_admin_only_select" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_only_select"
on public.admin_audit_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);

drop policy if exists "admin_audit_logs_admin_only_insert" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_only_insert"
on public.admin_audit_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  )
);