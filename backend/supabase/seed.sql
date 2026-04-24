-- USERS (tanpa guest) - upsert by email
insert into public.users (
  email,
  full_name,
  role,
  ktm_image_url,
  is_student_verified,
  city,
  university_name,
  major,
  about,
  skills,
  is_active,
  account_status,
  email_verified_at,
  approved_at
) values
('client1@studelance.com','Client Satu','client',null,true,'Bandung',null,null,'Klien startup edutech yang sering mencari mahasiswa untuk UI, riset, dan implementation support.','{}',true,'approved',now(),now()),
('client2@studelance.com','Client Dua','client',null,true,'Yogyakarta',null,null,'Pemilik bisnis lokal yang mencari bantuan digital dengan budget terjangkau.','{}',true,'approved',now(),now()),
('student1@studelance.com','Student Satu','student','https://example.com/ktm/student1.jpg',true,'Bandung','Institut Teknologi Bandung','Teknik Informatika','Mahasiswa akhir yang fokus pada pengembangan frontend modern dan dashboard internal.',array['React','Next.js','Tailwind CSS'],true,'approved',now(),now()),
('student2@studelance.com','Student Dua','student','https://example.com/ktm/student2.jpg',false,'Bandung','Universitas Padjadjaran','Sistem Informasi','Mahasiswa sistem informasi yang sedang menunggu verifikasi akun.',array['UI Research','Figma'],false,'pending',now(),null),
('student3@studelance.com','Student Tiga','student','https://example.com/ktm/student3.jpg',true,'Yogyakarta','Universitas Gadjah Mada','Ilmu Komputer','Mahasiswa yang senang mengerjakan analitik, visualisasi data, dan reporting workflow.',array['Data Viz','PostgreSQL','Product Analytics'],true,'approved',now(),now())
on conflict (email) do update
set full_name = excluded.full_name,
    role = excluded.role,
    ktm_image_url = excluded.ktm_image_url,
    is_student_verified = excluded.is_student_verified,
    city = excluded.city,
    university_name = excluded.university_name,
    major = excluded.major,
    about = excluded.about,
    skills = excluded.skills,
    is_active = excluded.is_active,
    account_status = excluded.account_status,
    email_verified_at = excluded.email_verified_at,
    approved_at = excluded.approved_at;

insert into public.projects (id, client_id, student_id, title, description, budget, city, category, deadline, status) values
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  (select id from public.users where email = 'client1@studelance.com'),
  (select id from public.users where email = 'student1@studelance.com'),
  'Website Company Profile',
  'Membutuhkan mahasiswa untuk merancang dan membangun website company profile modern dengan CMS ringan serta halaman layanan.',
  2500000,
  'Bandung',
  'Web Development',
  '2026-05-30',
  'in_progress'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  (select id from public.users where email = 'client1@studelance.com'),
  null,
  'Mobile App UI Revamp',
  'Revamp UI aplikasi mobile kampus agar lebih segar, ringan, dan mudah dipakai oleh mahasiswa baru.',
  1800000,
  'Bandung',
  'UI/UX Design',
  '2026-06-10',
  'open'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  (select id from public.users where email = 'client2@studelance.com'),
  (select id from public.users where email = 'student3@studelance.com'),
  'Dashboard Analytics',
  'Pembuatan dashboard analytics untuk memantau traffic, funnel, dan performa konten promosi bisnis lokal.',
  3200000,
  'Yogyakarta',
  'Analytics',
  '2026-04-20',
  'completed'
)
on conflict (id) do update
set client_id = excluded.client_id,
    student_id = excluded.student_id,
    title = excluded.title,
    description = excluded.description,
    budget = excluded.budget,
    city = excluded.city,
    category = excluded.category,
    deadline = excluded.deadline,
    status = excluded.status;

insert into public.project_members (project_id, user_id, role) values
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  (select id from public.users where email = 'client1@studelance.com'),
  'client'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  (select id from public.users where email = 'student1@studelance.com'),
  'student'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  (select id from public.users where email = 'client1@studelance.com'),
  'client'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  (select id from public.users where email = 'client2@studelance.com'),
  'client'
),
(
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
  (select id from public.users where email = 'student3@studelance.com'),
  'student'
)
on conflict (project_id, user_id) do update
set role = excluded.role;

insert into public.project_applications (id, project_id, student_id, proposal, proposed_budget, status) values
(
  'abababab-abab-4aba-8aba-ababababab01',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  (select id from public.users where email = 'student3@studelance.com'),
  'Saya punya pengalaman redesign dashboard dan mobile flow untuk organisasi kampus. Saya bisa bantu audit UI, redesign screen utama, dan handoff Figma.',
  1700000,
  'pending'
),
(
  'abababab-abab-4aba-8aba-ababababab02',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
  (select id from public.users where email = 'student1@studelance.com'),
  'Saya biasa mengerjakan sistem desain, komponen reusable, dan validasi usability. Bisa bantu dari wireframe sampai prototype final.',
  1800000,
  'pending'
)
on conflict (id) do update
set proposal = excluded.proposal,
    proposed_budget = excluded.proposed_budget,
    status = excluded.status;

insert into public.milestones (id, project_id, title, description, amount, due_date, status) values
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Wireframe & Requirement','Workshop kebutuhan, struktur halaman, dan wireframe awal untuk seluruh landing dan service page.',500000,'2026-05-01','paid'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','Implementasi Frontend','Pengembangan frontend responsif berdasarkan wireframe yang sudah disetujui.',1200000,'2026-05-20','working'),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3','Integrasi Chart & Export','Pembuatan modul chart utama, export CSV, dan ringkasan performa mingguan.',900000,'2026-04-15','paid')
on conflict (id) do update
set project_id = excluded.project_id,
    title = excluded.title,
    description = excluded.description,
    amount = excluded.amount,
    due_date = excluded.due_date,
    status = excluded.status;

insert into public.payments (id, milestone_id, project_id, amount, platform_fee, status, notes) values
('cccccccc-cccc-4ccc-8ccc-ccccccccccc1','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',500000,50000,'paid','Tahap pertama selesai dan dibayar.'),
('cccccccc-cccc-4ccc-8ccc-ccccccccccc2','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',600000,60000,'pending','Dana disiapkan untuk milestone kedua.'),
('cccccccc-cccc-4ccc-8ccc-ccccccccccc3','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',900000,90000,'paid','Final milestone analytics berhasil dibayar.')
on conflict (id) do update
set milestone_id = excluded.milestone_id,
    project_id = excluded.project_id,
    amount = excluded.amount,
    platform_fee = excluded.platform_fee,
    status = excluded.status,
    notes = excluded.notes;

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
  'Siap, wireframe sudah 80% dan saya kirimkan revisi malam ini.',
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
