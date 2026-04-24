"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/utils/apiClient";
import { ApiResponse } from "@/types/api";
import { Project } from "@/types/project";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

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

  if (projectQuery.isLoading) return <p className="text-sm text-muted-foreground">Memuat detail project...</p>;
  if (projectQuery.isError) return <p className="text-red-600">Gagal memuat detail project.</p>;
  if (!projectQuery.data) return <p>Project tidak ditemukan.</p>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{projectQuery.data.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Status: {projectQuery.data.status}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          {projectQuery.data.milestones?.length ? (
            <ul className="space-y-2">
              {projectQuery.data.milestones.map((m) => (
                <li key={m.id} className="rounded-lg border p-3">
                  <p className="font-medium">{m.title}</p>
                  <p className="text-sm text-muted-foreground">Amount: {formatCurrency(m.amount)}</p>
                  <p className="text-sm text-muted-foreground">Status: {m.status}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>Belum ada milestone.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}