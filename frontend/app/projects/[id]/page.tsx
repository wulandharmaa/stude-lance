"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AuthGuard from "@/components/layout/AuthGuard";
import AppShell from "@/components/layout/AppShell";
import apiClient from "@/utils/apiClient";
import { ApiResponse } from "@/types/api";
import { Project } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const projectQuery = useQuery({
    queryKey: ["project-detail", projectId],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<Project[]>>("/api/projects");
      if (!res.data.success) throw new Error(res.data.message);
      const found = res.data.data.find((p) => p.id === projectId);
      if (!found) throw new Error("Project tidak ditemukan.");
      return found;
    },
    enabled: !!projectId,
  });

  return (
    <AuthGuard>
      <AppShell>
        {projectQuery.isLoading && <p>Memuat detail project...</p>}
        {projectQuery.isError && <p className="text-red-600">Gagal memuat detail project.</p>}

        {projectQuery.data && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>{projectQuery.data.title}</CardTitle></CardHeader>
              <CardContent>
                <p>Status: {projectQuery.data.status}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
              <CardContent>
                {projectQuery.data.milestones?.length ? (
                  <ul className="space-y-2">
                    {projectQuery.data.milestones.map((m) => (
                      <li key={m.id} className="border rounded-md p-3">
                        <p className="font-medium">{m.title}</p>
                        <p className="text-sm">Amount: {m.amount}</p>
                        <p className="text-sm">Status: {m.status}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Belum ada milestone.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </AppShell>
    </AuthGuard>
  );
}