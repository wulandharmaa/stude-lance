-- Aktifkan RLS
alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.payments enable row level security;
alter table public.schedules enable row level security;
alter table public.messages enable row level security;

-- USERS
create policy "users_select_own"
on public.users for select
to authenticated
using (id = auth.uid());

create policy "users_update_own"
on public.users for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- PROJECTS
create policy "projects_select_member"
on public.projects for select
to authenticated
using (client_id = auth.uid() or student_id = auth.uid());

create policy "projects_insert_client_only"
on public.projects for insert
to authenticated
with check (
  client_id = auth.uid()
  and exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'client'
  )
);

create policy "projects_update_member"
on public.projects for update
to authenticated
using (client_id = auth.uid() or student_id = auth.uid())
with check (client_id = auth.uid() or student_id = auth.uid());

-- MILESTONES
create policy "milestones_select_project_member"
on public.milestones for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = milestones.project_id
      and (p.client_id = auth.uid() or p.student_id = auth.uid())
  )
);

create policy "milestones_write_client_only"
on public.milestones for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = milestones.project_id
      and p.client_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = milestones.project_id
      and p.client_id = auth.uid()
  )
);

-- PAYMENTS
create policy "payments_select_project_member"
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.milestones m
    join public.projects p on p.id = m.project_id
    where m.id = payments.milestone_id
      and (p.client_id = auth.uid() or p.student_id = auth.uid())
  )
);

create policy "payments_write_client_only"
on public.payments for all
to authenticated
using (
  exists (
    select 1
    from public.milestones m
    join public.projects p on p.id = m.project_id
    where m.id = payments.milestone_id
      and p.client_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.milestones m
    join public.projects p on p.id = m.project_id
    where m.id = payments.milestone_id
      and p.client_id = auth.uid()
  )
);

-- SCHEDULES
create policy "schedules_select_own"
on public.schedules for select
to authenticated
using (user_id = auth.uid());

create policy "schedules_write_own"
on public.schedules for all
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- MESSAGES
create policy "messages_select_project_member"
on public.messages for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = messages.project_id
      and (p.client_id = auth.uid() or p.student_id = auth.uid())
  )
);

create policy "messages_insert_sender_only"
on public.messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1
    from public.projects p
    where p.id = messages.project_id
      and (p.client_id = auth.uid() or p.student_id = auth.uid())
  )
);

create policy "messages_delete_sender_only"
on public.messages for delete
to authenticated
using (sender_id = auth.uid());