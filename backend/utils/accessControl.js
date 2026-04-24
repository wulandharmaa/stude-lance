import supabase from '@/utils/supabaseClient';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';

export async function getProjectById(projectId) {
  if (!isValidUuid(projectId)) throw new ApiError(400, 'project_id tidak valid.');

  const { data, error } = await supabase
    .from('projects')
    .select('id, client_id, student_id, title, description, budget, city, category, deadline, status, created_at')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Project tidak ditemukan.');

  return data;
}

export async function getMilestoneById(milestoneId) {
  if (!isValidUuid(milestoneId)) throw new ApiError(400, 'milestone_id tidak valid.');

  const { data, error } = await supabase
    .from('milestones')
    .select('id, project_id, title, description, status, amount, due_date')
    .eq('id', milestoneId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Milestone tidak ditemukan.');

  return data;
}

export async function getProjectMembership(projectId, userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select('id, project_id, user_id, role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  return data || null;
}

export async function getApplicationForStudent(projectId, userId) {
  const { data, error } = await supabase
    .from('project_applications')
    .select('id, project_id, student_id, status')
    .eq('project_id', projectId)
    .eq('student_id', userId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  return data || null;
}

export async function isProjectMember(projectId, userId, project = null) {
  const currentProject = project || await getProjectById(projectId);
  if (currentProject.client_id === userId || currentProject.student_id === userId) {
    return true;
  }

  const membership = await getProjectMembership(currentProject.id, userId);
  return !!membership;
}

export async function assertProjectMember(projectId, userId) {
  const project = await getProjectById(projectId);
  const member = await isProjectMember(projectId, userId, project);
  if (!member) throw new ApiError(403, 'Akses ditolak untuk project ini.');
  return project;
}

export async function assertProjectClient(projectId, userId) {
  const project = await getProjectById(projectId);
  if (project.client_id !== userId) throw new ApiError(403, 'Hanya client project yang diizinkan.');
  return project;
}

export async function assertMilestoneProjectMember(milestoneId, userId) {
  const milestone = await getMilestoneById(milestoneId);
  const project = await assertProjectMember(milestone.project_id, userId);
  return { milestone, project };
}

export async function assertMilestoneProjectClient(milestoneId, userId) {
  const milestone = await getMilestoneById(milestoneId);
  const project = await assertProjectClient(milestone.project_id, userId);
  return { milestone, project };
}

export async function assertProjectVisibleToUser(projectId, user) {
  const project = await getProjectById(projectId);
  if (user.role === 'admin') return project;
  if (project.client_id === user.id || project.student_id === user.id) return project;

  const membership = await getProjectMembership(projectId, user.id);
  if (membership) return project;

  if (user.role === 'student') {
    const application = await getApplicationForStudent(projectId, user.id);
    if (application || project.status === 'open') return project;
  }

  throw new ApiError(403, 'Akses ditolak untuk project ini.');
}
