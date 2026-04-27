"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/utils/apiClient";
import { fetchProject } from "@/utils/fetchers";
import { formatCurrency, formatDate, formatDateTime, formatFileSize } from "@/utils/formatters";
import type { ApiResponse } from "@/types/api";
import type { Project, ProjectFile, ProjectMessage } from "@/types/project";
import { toast } from "sonner";

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as AxiosError<{ message?: string }>;
  return axiosErr?.response?.data?.message || axiosErr?.message || fallback;
}

const tabs = ["overview", "messages", "files"] as const;

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("overview");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [coverUrl, setCoverUrl] = useState("");

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
    enabled: !!projectId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<ProjectMessage>>("/api/messages", {
        project_id: projectId,
        content: message,
      });
      return res.data.data;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err, "Gagal mengirim proposal."));
    },
  });

  const uploadFileMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pilih file terlebih dahulu.");
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiClient.post<ApiResponse<ProjectFile>>(`/api/projects/${projectId}/files`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
    onSuccess: () => {
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("File berhasil diunggah.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<unknown>>(`/api/projects/${projectId}/applications`, {
        proposal:
          "Saya siap membantu proyek ini dengan pendekatan yang terstruktur, komunikasi rutin, dan timeline yang disesuaikan dengan kalender akademik.",
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Proposal berhasil dikirim.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const applicationDecisionMutation = useMutation({
    mutationFn: async ({ applicationId, status }: { applicationId: string; status: "accepted" | "rejected" }) => {
      const res = await apiClient.patch<ApiResponse<unknown>>(`/api/applications/${applicationId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Status proposal diperbarui.");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const milestoneStatusMutation = useMutation({
    mutationFn: async ({ milestoneId, status }: { milestoneId: string; status: string }) => {
      const res = await apiClient.patch<ApiResponse<unknown>>(`/api/milestones/${milestoneId}/status`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      toast.success("Status milestone diperbarui.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateCoverMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<ApiResponse<Project>>(`/api/projects/${projectId}`, {
        project_image_url: coverUrl || null,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Cover project diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Gagal memperbarui cover project."));
    },
  });

  const project = projectQuery.data as Project | undefined;
  const canManage = project?.permissions.can_manage_project;

  const milestoneTotal = useMemo(
    () => (project?.milestones || []).reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [project?.milestones]
  );

  if (!project) {
    return <div className="glass-panel p-8 text-center text-sm text-slate-600">Memuat detail project...</div>;
  }

  const currentCoverUrl =
    project.project_image_url ||
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1600&auto=format&fit=crop";

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="mb-5 overflow-hidden rounded-3xl border border-[#d7e2d2]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentCoverUrl} alt={project.title} className="h-56 w-full object-cover" />
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Collaboration Hub</p>
            <h2 className="mt-4 text-4xl font-bold text-slate-950">{project.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">{project.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {project.status.replace("_", " ")}
              </Badge>
              <Badge variant="outline">{project.category || "General"}</Badge>
              <Badge variant="outline">{project.city || "Kota belum diisi"}</Badge>
            </div>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <p className="text-sm font-medium text-slate-500">Budget</p>
            <p className="text-3xl font-bold text-slate-950">{formatCurrency(project.budget)}</p>
            {project.permissions.can_apply ? (
              <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending}>
                Apply to Project
              </Button>
            ) : null}
          </div>
        </div>
        {canManage ? (
          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <Input
              placeholder="Update project cover image URL (opsional)"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
            <Button onClick={() => updateCoverMutation.mutate()} disabled={updateCoverMutation.isPending}>
              Save Cover
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Button key={tab} variant={activeTab === tab ? "default" : "outline"} onClick={() => setActiveTab(tab)}>
            {tab}
          </Button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="rounded-[28px] border-white/70">
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.milestones.map((milestone) => (
                  <div key={milestone.id} className="rounded-3xl border border-[#d7e2d2] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{milestone.title}</p>
                        <p className="mt-2 text-sm text-slate-600">{milestone.description}</p>
                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                          <span>{formatCurrency(milestone.amount)}</span>
                          <span>•</span>
                          <span>Due {formatDate(milestone.due_date)}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {milestone.status}
                        </Badge>
                        {canManage && milestone.status !== "paid" ? (
                          <select
                            className="rounded-xl border border-input bg-white px-3 py-2 text-sm"
                            value={milestone.status}
                            onChange={(e) =>
                              milestoneStatusMutation.mutate({ milestoneId: milestone.id, status: e.target.value })
                            }
                          >
                            {["pending", "funded", "working", "approved", "paid"].map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {canManage ? (
              <Card className="rounded-[28px] border-white/70">
                <CardHeader>
                  <CardTitle>Incoming Applications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.applications.length === 0 ? (
                    <p className="text-sm text-slate-600">Belum ada proposal dari mahasiswa.</p>
                  ) : (
                    project.applications.map((application) => (
                      <div key={application.id} className="rounded-3xl border border-[#d7e2d2] p-4">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">{application.student?.full_name || "Student"}</p>
                            <p className="mt-2 text-sm leading-7 text-slate-600">{application.proposal}</p>
                            {application.proposed_budget ? (
                              <p className="mt-2 text-sm text-slate-500">
                                Proposed budget: {formatCurrency(application.proposed_budget)}
                              </p>
                            ) : null}
                          </div>
                          <div className="flex flex-col gap-2">
                            <Badge variant="secondary" className="capitalize">
                              {application.status}
                            </Badge>
                            {application.status === "pending" ? (
                              <>
                                <Button
                                  onClick={() =>
                                    applicationDecisionMutation.mutate({
                                      applicationId: application.id,
                                      status: "accepted",
                                    })
                                  }
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    applicationDecisionMutation.mutate({
                                      applicationId: application.id,
                                      status: "rejected",
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="rounded-[28px] border-white/70">
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Client</span>
                  <span className="font-semibold text-slate-900">{project.client?.full_name || "TBD"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Assigned Student</span>
                  <span className="font-semibold text-slate-900">{project.assigned_student?.full_name || "Belum ada"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Milestone Total</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(milestoneTotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Paid Amount</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(project.payment_summary.paid_amount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Platform Fee</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(project.payment_summary.total_fee)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "messages" ? (
        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Project Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.messages.map((item) => (
              <div key={item.id} className="rounded-3xl border border-[#d7e2d2] p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-slate-900">{item.sender?.full_name || "User"}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(item.created_at)}</p>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.content}</p>
              </div>
            ))}
            {project.permissions.can_message ? (
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input placeholder="Ketik pesan untuk tim proyek..." value={message} onChange={(e) => setMessage(e.target.value)} />
                <Button onClick={() => sendMessageMutation.mutate()} disabled={sendMessageMutation.isPending || !message.trim()}>
                  Send Message
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-600">Chat tersedia setelah Anda menjadi anggota project.</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "files" ? (
        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Project Files</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.files.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-3xl border border-[#d7e2d2] p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{item.file_name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.uploader?.full_name || "Uploader"} • {formatFileSize(item.file_size)} • {formatDateTime(item.created_at)}
                  </p>
                </div>
                {item.download_url ? (
                  <Button asChild variant="outline">
                    <a href={item.download_url} target="_blank" rel="noreferrer">
                      Open File
                    </a>
                  </Button>
                ) : null}
              </div>
            ))}
            {project.permissions.can_upload_files ? (
              <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <Button onClick={() => uploadFileMutation.mutate()} disabled={uploadFileMutation.isPending || !file}>
                  Upload File
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-600">File sharing dibuka setelah Anda tergabung sebagai anggota project.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
