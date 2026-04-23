import supabase from '@/utils/supabaseClient';
import { ApiError } from '@/utils/apiError';
import { isValidUuid } from '@/utils/validators';

export async function getProjectById(projectId) {
  if (!isValidUuid(projectId)) throw new ApiError(400, 'project_id tidak valid.');

  const { data, error } = await supabase
    .from('projects')
    .select('id, client_id, student_id, status, title')
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
    .select('id, project_id, title, status, amount')
    .eq('id', milestoneId)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  if (!data) throw new ApiError(404, 'Milestone tidak ditemukan.');

  return data;
}

export async function assertProjectMember(projectId, userId) {
  const project = await getProjectById(projectId);
  const isMember = project.client_id === userId || project.student_id === userId;
  if (!isMember) throw new ApiError(403, 'Akses ditolak untuk project ini.');
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