"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/layout/AuthGuard";
import AppShell from "@/components/layout/AppShell";
import KtmVerificationCard from "@/components/ktm/KtmVerificationCard";
import apiClient from "@/utils/apiClient";
import { ApiResponse } from "@/types/api";
import { Project } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const projectsQuery = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project[]>>("/api/projects");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  return (
    <AuthGuard>
      <AppShell>
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>

          <KtmVerificationCard />

          <Card>
            <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {projectsQuery.isLoading && <p>Memuat project...</p>}
              {projectsQuery.isError && <p className="text-red-600">Gagal memuat project.</p>}
              {!projectsQuery.isLoading && !projectsQuery.isError && projectsQuery.data?.length === 0 && (
                <p>Belum ada project.</p>
              )}
              <ul className="space-y-2">
                {projectsQuery.data?.map((project) => (
                  <li key={project.id} className="border rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-gray-500">Status: {project.status}</p>
                      </div>
                      <Link className="text-sm underline" href={`/projects/${project.id}`}>
                        Detail
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    </AuthGuard>
  );
}