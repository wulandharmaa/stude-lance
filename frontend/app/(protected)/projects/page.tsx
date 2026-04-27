"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/utils/apiClient";
import { fetchMe, fetchProjects } from "@/utils/fetchers";
import { formatCurrency, formatDate } from "@/utils/formatters";
import type { ApiResponse } from "@/types/api";
import type { Project } from "@/types/project";
import { toast } from "sonner";

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as AxiosError<{ message?: string }>;
  return axiosErr?.response?.data?.message || axiosErr?.message || fallback;
}

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ q: "", city: "", category: "", status: "" });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", filters],
    queryFn: () => fetchProjects(filters),
  });

  const applyMutation = useMutation({
    mutationFn: async (projectId: string) => {
      const res = await apiClient.post<ApiResponse<unknown>>(`/api/projects/${projectId}/applications`, {
        proposal:
          "Saya tertarik mengerjakan proyek ini dan bisa menyesuaikan timeline dengan jadwal kuliah. Saya siap berdiskusi detail deliverable serta milestone berikutnya.",
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Proposal berhasil dikirim.");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (err: Error) => {
      toast.error(getApiErrorMessage(err, "Gagal mengirim proposal."));
    },
  });

  const role = meQuery.data?.profile.role;
  const canStudentApplyInstantly =
    role === "student" &&
    !!meQuery.data?.profile.is_active &&
    !!meQuery.data?.profile.is_student_verified &&
    meQuery.data?.profile.account_status === "approved";
  const projects = projectsQuery.data?.items || [];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">
              {role === "client" ? "Project Portfolio" : role === "admin" ? "Project Monitoring" : "Marketplace"}
            </p>
            <h2 className="mt-4 text-4xl font-bold text-slate-950">
              {role === "client" ? "Kelola seluruh proyek Anda." : "Temukan proyek yang cocok dengan skill Anda."}
            </h2>
          </div>
          {role === "client" ? (
            <Button asChild>
              <Link href="/projects/create">Create Project</Link>
            </Button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="Cari berdasarkan judul atau deskripsi"
              value={filters.q}
              onChange={(e) => setFilters((current) => ({ ...current, q: e.target.value }))}
            />
          </div>
          <Input placeholder="Kota" value={filters.city} onChange={(e) => setFilters((current) => ({ ...current, city: e.target.value }))} />
          <Input
            placeholder="Kategori"
            value={filters.category}
            onChange={(e) => setFilters((current) => ({ ...current, category: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {projects.map((project: Project) => (
          <Card key={project.id} className="rounded-[28px] border-white/70">
            <CardHeader className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-[#d7e2d2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    project.project_image_url ||
                    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop"
                  }
                  alt="Project collaboration preview"
                  className="h-36 w-full object-cover"
                />
              </div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                  <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3 text-sm text-slate-500">
                <span>{project.city || "Kota belum diisi"}</span>
                <span>•</span>
                <span>{project.category || "General"}</span>
                <span>•</span>
                <span>{formatCurrency(project.budget)}</span>
                <span>•</span>
                <span>Deadline {formatDate(project.deadline)}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {project.client?.full_name ? <Badge variant="outline">Client: {project.client.full_name}</Badge> : null}
                {project.assigned_student?.full_name ? <Badge variant="outline">Student: {project.assigned_student.full_name}</Badge> : null}
                {project.my_application ? <Badge>Applied</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link href={`/projects/${project.id}`}>Open Detail</Link>
                </Button>
                {role === "student" && project.permissions.can_apply ? (
                  canStudentApplyInstantly ? (
                    <Button onClick={() => applyMutation.mutate(project.id)} disabled={applyMutation.isPending}>
                      Apply Instantly
                    </Button>
                  ) : (
                    <Button asChild variant="outline">
                      <Link href="/dashboard">Complete Verification First</Link>
                    </Button>
                  )
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
