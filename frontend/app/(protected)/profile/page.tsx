"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/utils/apiClient";
import { fetchProfile, fetchProjects } from "@/utils/fetchers";
import { formatDate } from "@/utils/formatters";
import type { ApiResponse } from "@/types/api";
import type { Project, UserProfile } from "@/types/project";
import { toast } from "sonner";

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });
  const projectsQuery = useQuery({
    queryKey: ["projects", "profile"],
    queryFn: () => fetchProjects(),
  });
  const [draft, setDraft] = useState<{
    full_name: string;
    city: string;
    university_name: string;
    major: string;
    about: string;
    avatar_url: string;
    skills: string;
  } | null>(null);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch<ApiResponse<UserProfile>>("/api/profile", {
        ...form,
        avatar_url: form.avatar_url || null,
        skills: form.skills.split(",").map((item) => item.trim()).filter(Boolean),
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Profil berhasil diperbarui.");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const profile = profileQuery.data;
  const completedProjects = (projectsQuery.data?.items || []).filter((project: Project) => project.status === "completed");

  if (!profile) {
    return <div className="glass-panel p-8 text-center text-sm text-slate-600">Memuat profil...</div>;
  }

  const form = draft ?? {
    full_name: profile.full_name || "",
    city: profile.city || "",
    university_name: profile.university_name || "",
    major: profile.major || "",
    about: profile.about || "",
    avatar_url: profile.avatar_url || "",
    skills: (profile.skills || []).join(", "),
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <div className="mb-4 flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name)}&background=EAF4E4&color=1F4D11`}
            alt={profile.full_name}
            className="size-16 rounded-full border border-[#d7e2d2] object-cover"
          />
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Profile Photo</p>
            <p className="text-sm text-slate-600">Masukkan URL gambar untuk avatar profil (opsional).</p>
          </div>
        </div>
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Profile</p>
        <h2 className="mt-4 text-4xl font-bold text-slate-950">{profile.full_name}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">{profile.about || "Tambahkan bio singkat agar klien atau admin memahami konteks Anda."}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {profile.role}
          </Badge>
          {profile.city ? <Badge variant="outline">{profile.city}</Badge> : null}
          {profile.university_name ? <Badge variant="outline">{profile.university_name}</Badge> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input
              placeholder="Nama lengkap"
              value={form.full_name}
              onChange={(e) => setDraft((current) => ({ ...(current ?? form), full_name: e.target.value }))}
            />
            <Input
              placeholder="Kota"
              value={form.city}
              onChange={(e) => setDraft((current) => ({ ...(current ?? form), city: e.target.value }))}
            />
            <Input
              placeholder="Universitas / Organisasi"
              value={form.university_name}
              onChange={(e) => setDraft((current) => ({ ...(current ?? form), university_name: e.target.value }))}
            />
            <Input
              placeholder="Jurusan / Bidang"
              value={form.major}
              onChange={(e) => setDraft((current) => ({ ...(current ?? form), major: e.target.value }))}
            />
            <Input
              placeholder="URL Foto Profil (opsional)"
              value={form.avatar_url}
              onChange={(e) => setDraft((current) => ({ ...(current ?? form), avatar_url: e.target.value }))}
            />
            <textarea
              className="min-h-40 rounded-3xl border border-input bg-white px-4 py-3 text-sm text-slate-700"
              placeholder="About"
              value={form.about}
              onChange={(e) => setDraft((current) => ({ ...(current ?? form), about: e.target.value }))}
            />
            <Input
              placeholder="Skills dipisahkan koma"
              value={form.skills}
              onChange={(e) => setDraft((current) => ({ ...(current ?? form), skills: e.target.value }))}
            />
            <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
              Save Profile
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>{profile.role === "student" ? "Portfolio Snapshot" : "Recent Project Highlights"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {completedProjects.length === 0 ? (
              <p className="text-sm text-slate-600">Belum ada project completed untuk ditampilkan pada profil.</p>
            ) : (
              completedProjects.map((project) => (
                <div key={project.id} className="rounded-3xl border border-[#d7e2d2] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{project.title}</p>
                      <p className="mt-2 text-sm text-slate-600">{project.description}</p>
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{project.category || "General"}</span>
                    <span>•</span>
                    <span>{formatDate(project.deadline)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
