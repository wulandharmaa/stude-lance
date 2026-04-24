import apiClient from "@/utils/apiClient";
import type { ApiResponse } from "@/types/api";
import type { AuthPayload, PaginatedProjects, Project, ProjectApplication, UserProfile } from "@/types/project";
import type { ScheduleItem } from "@/types/schedule";
import type { PaymentRecord } from "@/types/payment";

export async function fetchMe() {
  const res = await apiClient.get<ApiResponse<AuthPayload>>("/api/auth/me");
  return res.data.data;
}

export async function fetchProfile() {
  const res = await apiClient.get<ApiResponse<UserProfile>>("/api/profile");
  return res.data.data;
}

export async function fetchProjects(params?: Record<string, string | number | undefined>) {
  const res = await apiClient.get<ApiResponse<PaginatedProjects>>("/api/projects", { params });
  return res.data.data;
}

export async function fetchProject(projectId: string) {
  const res = await apiClient.get<ApiResponse<Project>>(`/api/projects/${projectId}`);
  return res.data.data;
}

export async function fetchSchedules() {
  const res = await apiClient.get<ApiResponse<ScheduleItem[]>>("/api/schedules");
  return res.data.data;
}

export async function fetchPayments(params?: Record<string, string | number | undefined>) {
  const res = await apiClient.get<ApiResponse<PaymentRecord[]>>("/api/payments", { params });
  return res.data.data;
}

export async function fetchProjectApplications(projectId: string) {
  const res = await apiClient.get<ApiResponse<ProjectApplication[]>>(`/api/projects/${projectId}/applications`);
  return res.data.data;
}
