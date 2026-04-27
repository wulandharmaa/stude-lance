"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/utils/apiClient";
import type { ApiResponse } from "@/types/api";
import type { Project } from "@/types/project";
import { toast } from "sonner";

type MilestoneDraft = {
  id: string;
  title: string;
  description: string;
  amount: string;
  due_date: string;
};

function createMilestoneDraft(seedTitle = ""): MilestoneDraft {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: seedTitle,
    description: "",
    amount: "",
    due_date: "",
  };
}

export default function CreateProjectPage() {
  const router = useRouter();
  const [milestones, setMilestones] = useState<MilestoneDraft[]>([
    createMilestoneDraft("Discovery"),
  ]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    project_image_url: "",
    budget: "",
    city: "",
    category: "",
    deadline: "",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<Project>>("/api/projects", {
        ...form,
        budget: Number(form.budget),
        project_image_url: form.project_image_url || null,
        milestones: milestones
          .filter((item) => item.title.trim())
          .map((item) => ({
            ...item,
            amount: Number(item.amount),
          })),
      });
      return res.data.data;
    },
    onSuccess: (project) => {
      toast.success("Project berhasil dibuat.");
      router.push(`/projects/${project.id}`);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Project Builder</p>
        <h2 className="mt-4 text-4xl font-bold text-slate-950">Buat proyek baru untuk mahasiswa.</h2>
      </div>

      <Card className="rounded-[28px] border-white/70">
        <CardHeader>
          <CardTitle>Step 1. Core Brief</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Project title" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
          <Input placeholder="Kategori" value={form.category} onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))} />
          <Input placeholder="Kota target" value={form.city} onChange={(e) => setForm((current) => ({ ...current, city: e.target.value }))} />
          <Input
            placeholder="Project cover image URL (opsional)"
            value={form.project_image_url}
            onChange={(e) => setForm((current) => ({ ...current, project_image_url: e.target.value }))}
          />
          <Input placeholder="Budget total (IDR)" value={form.budget} onChange={(e) => setForm((current) => ({ ...current, budget: e.target.value }))} />
          <Input className="md:col-span-2" type="date" value={form.deadline} onChange={(e) => setForm((current) => ({ ...current, deadline: e.target.value }))} />
          <textarea
            className="min-h-40 rounded-3xl border border-input bg-white px-4 py-3 text-sm text-slate-700 md:col-span-2"
            placeholder="Deskripsikan scope kerja, deliverables, dan requirement penting."
            value={form.description}
            onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))}
          />
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-white/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Step 2. Micro-Milestones</CardTitle>
          <Button
            variant="outline"
            onClick={() => setMilestones((current) => [...current, createMilestoneDraft()])}
          >
            Add Milestone
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {milestones.map((milestone, index) => (
            <div key={milestone.id} className="grid gap-4 rounded-3xl border border-[#d7e2d2] p-4 md:grid-cols-2">
              <Input
                placeholder={`Milestone ${index + 1} title`}
                value={milestone.title}
                onChange={(e) =>
                  setMilestones((current) =>
                    current.map((item, itemIndex) => (itemIndex === index ? { ...item, title: e.target.value } : item))
                  )
                }
              />
              <Input
                placeholder="Amount (IDR)"
                value={milestone.amount}
                onChange={(e) =>
                  setMilestones((current) =>
                    current.map((item, itemIndex) => (itemIndex === index ? { ...item, amount: e.target.value } : item))
                  )
                }
              />
              <Input
                type="date"
                value={milestone.due_date}
                onChange={(e) =>
                  setMilestones((current) =>
                    current.map((item, itemIndex) => (itemIndex === index ? { ...item, due_date: e.target.value } : item))
                  )
                }
              />
              <textarea
                className="min-h-28 rounded-3xl border border-input bg-white px-4 py-3 text-sm text-slate-700 md:col-span-2"
                placeholder="Milestone description"
                value={milestone.description}
                onChange={(e) =>
                  setMilestones((current) =>
                    current.map((item, itemIndex) =>
                      itemIndex === index ? { ...item, description: e.target.value } : item
                    )
                  )
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? "Creating..." : "Publish Project"}
        </Button>
      </div>
    </div>
  );
}
