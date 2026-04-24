import supabase from '@/utils/supabaseClient';
import supabaseAdmin from '@/utils/supabaseAdmin';
import { ApiError } from '@/utils/apiError';

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function groupBy(items, key) {
  return (items || []).reduce((acc, item) => {
    const value = item[key];
    if (!acc[value]) acc[value] = [];
    acc[value].push(item);
    return acc;
  }, {});
}

function toPlainUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    city: user.city,
    university_name: user.university_name,
    major: user.major,
    about: user.about,
    skills: user.skills || [],
    avatar_url: user.avatar_url,
    is_student_verified: user.is_student_verified,
  };
}

async function loadUsers(userIds) {
  const ids = unique(userIds);
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from('users')
    .select(`
      id,
      email,
      full_name,
      role,
      city,
      university_name,
      major,
      about,
      skills,
      avatar_url,
      is_student_verified
    `)
    .in('id', ids);

  if (error) throw new ApiError(500, error.message);

  return (data || []).reduce((acc, user) => {
    acc[user.id] = toPlainUser(user);
    return acc;
  }, {});
}

async function loadSignedProjectFiles(files) {
  if (!files?.length) return [];

  return Promise.all(
    files.map(async (file) => {
      const { data } = await supabaseAdmin.storage
        .from('project-files')
        .createSignedUrl(file.storage_path, 3600);

      return {
        ...file,
        download_url: data?.signedUrl || null,
      };
    })
  );
}

export async function hydrateProjects(projects, options = {}) {
  const {
    viewerId = null,
    viewerRole = null,
    includeMessages = false,
    includeFiles = false,
    includeApplications = true,
  } = options;

  if (!projects?.length) return [];

  const projectIds = projects.map((project) => project.id);

  const [membersRes, milestonesRes, applicationsRes, filesRes, messagesRes] = await Promise.all([
    supabase
      .from('project_members')
      .select('id, project_id, user_id, role, created_at')
      .in('project_id', projectIds),
    supabase
      .from('milestones')
      .select('id, project_id, title, description, amount, due_date, status, created_at')
      .in('project_id', projectIds)
      .order('created_at', { ascending: true }),
    includeApplications
      ? supabase
          .from('project_applications')
          .select('id, project_id, student_id, proposal, proposed_budget, status, created_at, updated_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    includeFiles
      ? supabase
          .from('project_files')
          .select('id, project_id, uploader_id, storage_path, file_name, file_size, mime_type, created_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    includeMessages
      ? supabase
          .from('messages')
          .select('id, project_id, sender_id, content, created_at')
          .in('project_id', projectIds)
          .order('created_at', { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);

  for (const result of [membersRes, milestonesRes, applicationsRes, filesRes, messagesRes]) {
    if (result?.error) throw new ApiError(500, result.error.message);
  }

  const paymentsRes = await supabase
    .from('payments')
    .select('id, milestone_id, project_id, amount, platform_fee, status, notes, created_at')
    .in('project_id', projectIds)
    .order('created_at', { ascending: false });

  if (paymentsRes.error) throw new ApiError(500, paymentsRes.error.message);

  const relatedUserIds = unique([
    ...projects.flatMap((project) => [project.client_id, project.student_id]),
    ...(membersRes.data || []).map((member) => member.user_id),
    ...(applicationsRes.data || []).map((application) => application.student_id),
    ...(filesRes.data || []).map((file) => file.uploader_id),
    ...(messagesRes.data || []).map((message) => message.sender_id),
  ]);

  const usersById = await loadUsers(relatedUserIds);
  const membersByProject = groupBy(membersRes.data || [], 'project_id');
  const milestonesByProject = groupBy(milestonesRes.data || [], 'project_id');
  const applicationsByProject = groupBy(applicationsRes.data || [], 'project_id');
  const paymentsByProject = groupBy(paymentsRes.data || [], 'project_id');
  const messagesByProject = groupBy(messagesRes.data || [], 'project_id');
  const signedFiles = await loadSignedProjectFiles(filesRes.data || []);
  const filesByProject = groupBy(signedFiles, 'project_id');

  return projects.map((project) => {
    const members = (membersByProject[project.id] || []).map((member) => ({
      ...member,
      user: usersById[member.user_id] || null,
    }));
    const applications = (applicationsByProject[project.id] || []).map((application) => ({
      ...application,
      student: usersById[application.student_id] || null,
    }));
    const milestonePayments = paymentsByProject[project.id] || [];
    const milestones = (milestonesByProject[project.id] || []).map((milestone) => ({
      ...milestone,
      payments: milestonePayments.filter((payment) => payment.milestone_id === milestone.id),
    }));
    const files = (filesByProject[project.id] || []).map((file) => ({
      ...file,
      uploader: usersById[file.uploader_id] || null,
    }));
    const messages = (messagesByProject[project.id] || []).map((message) => ({
      ...message,
      sender: usersById[message.sender_id] || null,
    }));
    const myApplication = viewerId
      ? applications.find((application) => application.student_id === viewerId) || null
      : null;
    const isMember =
      !!members.find((member) => member.user_id === viewerId) ||
      project.client_id === viewerId ||
      project.student_id === viewerId;
    const paymentSummary = milestonePayments.reduce(
      (acc, payment) => {
        acc.total_amount += Number(payment.amount || 0);
        acc.total_fee += Number(payment.platform_fee || 0);
        if (payment.status === 'paid') acc.paid_amount += Number(payment.amount || 0);
        if (payment.status === 'pending') acc.pending_amount += Number(payment.amount || 0);
        if (payment.status === 'approved') acc.approved_amount += Number(payment.amount || 0);
        return acc;
      },
      { total_amount: 0, total_fee: 0, paid_amount: 0, pending_amount: 0, approved_amount: 0 }
    );

    return {
      ...project,
      client: usersById[project.client_id] || null,
      assigned_student: usersById[project.student_id] || null,
      members,
      milestones,
      applications,
      my_application: myApplication,
      messages,
      files,
      payments: milestonePayments,
      payment_summary: paymentSummary,
      counts: {
        milestones: milestones.length,
        applications: applications.length,
        files: files.length,
        messages: messages.length,
      },
      permissions: {
        is_member: isMember,
        can_manage_project: viewerRole === 'admin' || project.client_id === viewerId,
        can_apply:
          viewerRole === 'student' &&
          project.status === 'open' &&
          !isMember &&
          !myApplication,
        can_message: isMember || viewerRole === 'admin',
        can_upload_files: isMember || viewerRole === 'admin',
      },
    };
  });
}
