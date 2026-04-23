-- USERS (tanpa guest) - upsert by email
insert into public.users (email, full_name, role, ktm_image_url, is_student_verified) values
('client1@studelance.com','Client Satu','client',null,true),
('client2@studelance.com','Client Dua','client',null,true),
('student1@studelance.com','Student Satu','student','https://example.com/ktm/student1.jpg',true),
('student2@studelance.com','Student Dua','student','https://example.com/ktm/student2.jpg',false),
('student3@studelance.com','Student Tiga','student','https://example.com/ktm/student3.jpg',true)
on conflict (email) do update
set full_name = excluded.full_name,
    role = excluded.role,
    ktm_image_url = excluded.ktm_image_url,
    is_student_verified = excluded.is_student_verified;

insert into public.projects (id, client_id, student_id, title, status) values
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  (select id from public.users where email = 'client1@studelance.com'),
  (select id from public.users where email = 'student1@studelance.com'),
  'Website Company Profile',
  'in_progress'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  (select id from public.users where email = 'client1@studelance.com'),
  (select id from public.users where email = 'student2@studelance.com'),
  'Mobile App UI Revamp',
  'open'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  (select id from public.users where email = 'client2@studelance.com'),
  (select id from public.users where email = 'student3@studelance.com'),
  'Dashboard Analytics',
  'completed'
)
on conflict (id) do update
set client_id = excluded.client_id,
    student_id = excluded.student_id,
    title = excluded.title,
    status = excluded.status;

insert into public.milestones (id, project_id, title, amount, due_date, status) values
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Wireframe & Requirement',500000,'2026-05-01','approved'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Implementasi Frontend',1200000,'2026-05-20','working'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Integrasi Chart & Export',900000,'2026-04-15','approved')
on conflict (id) do update
set project_id = excluded.project_id,
    title = excluded.title,
    amount = excluded.amount,
    due_date = excluded.due_date,
    status = excluded.status;

insert into public.payments (id, milestone_id, amount, status) values
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',500000,'paid'),
('cccccccc-cccc-4ccc-8ccc-ccccccccccc2','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',600000,'pending'),
('cccccccc-cccc-4ccc-8ccc-ccccccccccc3','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',900000,'paid')
on conflict (id) do update
set milestone_id = excluded.milestone_id,
    amount = excluded.amount,
    status = excluded.status;

insert into public.schedules (id, user_id, project_id, title, type, start_time, end_time) values
(
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  (select id from public.users where email = 'student1@studelance.com'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'Deadline Wireframe',
  'project_deadline',
  '2026-04-29T08:00:00Z',
  '2026-04-29T10:00:00Z'
),
(
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
  (select id from public.users where email = 'student2@studelance.com'),
  null,
  'Ujian Basis Data',
  'exam',
  '2026-05-10T01:00:00Z',
  '2026-05-10T03:00:00Z'
),
(
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd3',
  (select id from public.users where email = 'student3@studelance.com'),
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  'Kelas AI',
  'academic',
  '2026-04-25T02:00:00Z',
  '2026-04-25T04:00:00Z'
)
on conflict (id) do update
set user_id = excluded.user_id,
    project_id = excluded.project_id,
    title = excluded.title,
    type = excluded.type,
    start_time = excluded.start_time,
    end_time = excluded.end_time;

insert into public.messages (id, project_id, sender_id, content, created_at) values
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  (select id from public.users where email = 'client1@studelance.com'),
  'Halo, mohon update progress hari ini.',
  now() - interval '2 day'
),
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  (select id from public.users where email = 'student1@studelance.com'),
  'Siap, wireframe sudah 80%.',
  now() - interval '1 day'
),
(
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  (select id from public.users where email = 'client2@studelance.com'),
  'Project selesai, mohon final review.',
  now()
)
on conflict (id) do update
set project_id = excluded.project_id,
    sender_id = excluded.sender_id,
    content = excluded.content,
    created_at = excluded.created_at;