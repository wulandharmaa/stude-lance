"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { ChevronLeft, ChevronRight, Download, Filter, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import KtmVerificationCard from "@/components/ktm/KtmVerificationCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/utils/apiClient";
import { fetchMe, fetchPayments, fetchProjects, fetchSchedules } from "@/utils/fetchers";
import { formatCurrency, formatDate, formatDateTime } from "@/utils/formatters";
import type { ApiResponse } from "@/types/api";
import type { Project, UserProfile } from "@/types/project";
import type { ScheduleItem } from "@/types/schedule";
import type { PaymentRecord } from "@/types/payment";
import { toast } from "sonner";

type PendingVerification = {
  id: string;
  status: string;
  created_at: string;
  ktm_preview_url: string | null;
  users: {
    id: string;
    email: string;
    full_name: string;
    university_name?: string | null;
  };
};

type PendingUser = {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "client" | "admin";
  account_status: "pending" | "approved" | "rejected";
  ktm_preview_url?: string | null;
  created_at: string;
};

type AuditLog = {
  id: string;
  action: string;
  created_at: string;
  payload: Record<string, string>;
};

type AdminUserListItem = {
  id: string;
  email: string;
  full_name: string;
  role: "student" | "client";
  ktm_image_url: string | null;
  is_student_verified: boolean;
  created_at: string;
};

type AdminUsersResponse = {
  message: string;
  data: AdminUserListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};

function getApiErrorMessage(err: unknown, fallback: string) {
  const axiosErr = err as AxiosError<{ message?: string }>;
  return axiosErr?.response?.data?.message || axiosErr?.message || fallback;
}

function getAvatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=EAF4E4&color=1F4D11`;
}

function MetricCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <Card className="rounded-[28px] border-white/70">
      <CardContent className="p-5">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className="mt-3 text-3xl font-bold text-slate-950">{value}</p>
        <p className="mt-2 text-sm text-slate-600">{hint}</p>
      </CardContent>
    </Card>
  );
}

function StudentDashboard({ profile }: { profile: UserProfile }) {
  const projectsQuery = useQuery({
    queryKey: ["projects", "student-dashboard"],
    queryFn: () => fetchProjects(),
  });
  const schedulesQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
  });

  const projects = projectsQuery.data?.items || [];
  const activeProjects = projects.filter((project) => project.permissions.is_member);
  const upcomingSchedules = (schedulesQuery.data || []).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Student Dashboard</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-bold text-slate-950">Halo, {profile.full_name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Kelola verifikasi KTM, cari proyek baru, dan sesuaikan timeline kerja dengan kelas atau ujian Anda.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="hidden overflow-hidden rounded-2xl border border-[#d7e2d2] bg-[#f4f8f0] md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop"
                alt="Mahasiswa kolaborasi mengerjakan proyek"
                className="h-24 w-36 object-cover"
              />
            </div>
            <div className="flex gap-3">
              <Button asChild variant="outline">
                <Link href="/calendar">Lihat Calendar</Link>
              </Button>
              <Button asChild>
                <Link href="/projects">Cari Proyek</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Open Opportunities"
          value={String(projects.filter((project) => project.status === "open").length)}
          hint="Project yang bisa dipantau atau dilamar."
        />
        <MetricCard
          title="Active Projects"
          value={String(activeProjects.length)}
          hint="Project di mana Anda sudah menjadi kolaborator."
        />
        <MetricCard
          title="Verification"
          value={profile.is_student_verified ? "Approved" : profile.account_status}
          hint="Status aktivasi akun mahasiswa."
        />
      </div>

      <KtmVerificationCard />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Project Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeProjects.length === 0 ? (
              <p className="text-sm text-slate-600">Belum ada project aktif. Jelajahi marketplace untuk mulai melamar.</p>
            ) : (
              activeProjects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="flex items-center justify-between rounded-3xl border border-[#d7e2d2] bg-[#fbfdf9] px-5 py-4 transition hover:border-primary/40"
                >
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{project.title}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {project.category || "General"} • {formatCurrency(project.budget)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {project.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Upcoming Calendar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingSchedules.length === 0 ? (
              <p className="text-sm text-slate-600">Belum ada jadwal akademik. Tambahkan kelas, ujian, atau deadline proyek.</p>
            ) : (
              upcomingSchedules.map((item: ScheduleItem) => (
                <div key={item.id} className="rounded-3xl border border-[#d7e2d2] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <Badge variant="outline" className="capitalize">
                      {item.type.replace("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{formatDateTime(item.start_time)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientDashboard({ profile }: { profile: UserProfile }) {
  const projectsQuery = useQuery({
    queryKey: ["projects", "client-dashboard"],
    queryFn: () => fetchProjects(),
  });
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchPayments(),
  });

  const projects = projectsQuery.data?.items || [];
  const inProgress = projects.filter((project) => project.status === "in_progress");
  const openProjects = projects.filter((project) => project.status === "open");
  const paidTotal = (paymentsQuery.data || []).reduce((acc, item: PaymentRecord) => {
    if (item.status === "paid") acc += Number(item.amount || 0);
    return acc;
  }, 0);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Client Dashboard</p>
        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-4xl font-bold text-slate-950">Workspace klien untuk {profile.full_name}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Buat proyek baru, pantau proposal mahasiswa, dan kendalikan micro-milestone payment dari satu tempat.
            </p>
          </div>
          <div className="flex items-end gap-3">
            <div className="hidden overflow-hidden rounded-2xl border border-[#d7e2d2] bg-[#f4f8f0] md:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200&auto=format&fit=crop"
                alt="Client mereview project dashboard"
                className="h-24 w-36 object-cover"
              />
            </div>
            <Button asChild>
              <Link href="/projects/create">Post a New Project</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Open Projects" value={String(openProjects.length)} hint="Masih mencari student yang tepat." />
        <MetricCard title="In Progress" value={String(inProgress.length)} hint="Kolaborasi yang sedang aktif berjalan." />
        <MetricCard title="Paid to Students" value={formatCurrency(paidTotal)} hint="Akumulasi pembayaran simulasi milestone." />
      </div>

      <Card className="rounded-[28px] border-white/70">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Project Portfolio</CardTitle>
          <Button asChild variant="outline">
            <Link href="/projects">Manage All</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project: Project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="grid gap-4 rounded-3xl border border-[#d7e2d2] bg-[#fbfdf9] px-5 py-5 md:grid-cols-[1fr_auto]"
            >
              <div>
                <p className="text-lg font-semibold text-slate-900">{project.title}</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">{project.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{project.city || "Kota belum diisi"}</span>
                  <span>•</span>
                  <span>{project.category || "General"}</span>
                  <span>•</span>
                  <span>{formatCurrency(project.budget)}</span>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <Badge variant="secondary" className="capitalize">
                  {project.status.replace("_", " ")}
                </Badge>
                <p className="text-xs text-slate-500">Deadline {formatDate(project.deadline)}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const searchParams = useSearchParams();
  const verificationSectionRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "client">("all");
  const [page, setPage] = useState(1);

  const pendingUsersQuery = useQuery({
    queryKey: ["admin-pending-users"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PendingUser[]>>("/api/admin/users/pending");
      return res.data.data;
    },
  });

  const verificationsQuery = useQuery({
    queryKey: ["admin-verifications"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<PendingVerification[]>>("/api/admin/verifications");
      return res.data.data;
    },
  });

  const auditQuery = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<{ items: AuditLog[] }>>("/api/admin/audit-logs");
      return res.data.data.items;
    },
  });

  const usersTableQuery = useQuery({
    queryKey: ["admin-users-table", search, roleFilter, page],
    queryFn: async () => {
      const res = await apiClient.get<AdminUsersResponse>("/api/users", {
        params: {
          q: search || undefined,
          role: roleFilter === "all" ? undefined : roleFilter,
          page,
          limit: 10,
        },
      });
      return res.data;
    },
  });

  const allUsersMetaQuery = useQuery({
    queryKey: ["admin-users-meta", "all"],
    queryFn: async () => {
      const res = await apiClient.get<AdminUsersResponse>("/api/users", { params: { page: 1, limit: 1 } });
      return res.data.meta.total;
    },
  });

  const studentUsersMetaQuery = useQuery({
    queryKey: ["admin-users-meta", "student"],
    queryFn: async () => {
      const res = await apiClient.get<AdminUsersResponse>("/api/users", {
        params: { role: "student", page: 1, limit: 1 },
      });
      return res.data.meta.total;
    },
  });

  const clientUsersMetaQuery = useQuery({
    queryKey: ["admin-users-meta", "client"],
    queryFn: async () => {
      const res = await apiClient.get<AdminUsersResponse>("/api/users", {
        params: { role: "client", page: 1, limit: 1 },
      });
      return res.data.meta.total;
    },
  });

  const approveVerificationMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      await apiClient.patch(`/api/admin/verifications/${verificationId}/approve`);
    },
    onSuccess: () => {
      toast.success("Verifikasi mahasiswa disetujui.");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-table"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-meta"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Gagal approve verifikasi."));
    },
  });

  const rejectVerificationMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      await apiClient.patch(`/api/admin/verifications/${verificationId}/reject`, {
        reason: "Perlu revisi dokumen KTM sebelum disetujui.",
      });
    },
    onSuccess: () => {
      toast.success("Verifikasi mahasiswa ditolak.");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-table"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-meta"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Gagal reject verifikasi."));
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.patch(`/api/admin/users/${userId}/approve`);
    },
    onSuccess: () => {
      toast.success("Akun user disetujui.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-table"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-meta"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Gagal menyetujui user."));
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.patch(`/api/admin/users/${userId}/reject`, {
        reason: "Data akun belum memenuhi syarat onboarding. Mohon perbarui profil dan verifikasi.",
      });
    },
    onSuccess: () => {
      toast.success("Akun user ditolak.");
      queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-table"] });
      queryClient.invalidateQueries({ queryKey: ["admin-users-meta"] });
    },
    onError: (err) => {
      toast.error(getApiErrorMessage(err, "Gagal menolak user."));
    },
  });

  const pendingUserMap = useMemo(
    () => new Map((pendingUsersQuery.data || []).map((item) => [item.id, item])),
    [pendingUsersQuery.data]
  );

  const verificationByUserMap = useMemo(
    () => new Map((verificationsQuery.data || []).map((item) => [item.users.id, item])),
    [verificationsQuery.data]
  );

  const users = usersTableQuery.data?.data || [];
  const meta = usersTableQuery.data?.meta;

  const exportCsv = () => {
    if (users.length === 0) {
      toast.message("Tidak ada data user untuk diexport.");
      return;
    }

    const headers = ["full_name", "email", "role", "status", "joined_date"];
    const rows = users.map((user) => {
      const pending = pendingUserMap.get(user.id);
      const verification = verificationByUserMap.get(user.id);

      let status = "Active";
      if (pending) status = "Pending Approval";
      if (verification) status = "Pending KTM";
      if (user.role === "student" && user.is_student_verified && !pending) status = "Verified";

      return [user.full_name, user.email, user.role, status, formatDate(user.created_at)];
    });

    const csv = [headers.join(","), ...rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin-users.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (searchParams.get("view") === "verifications") {
      verificationSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-950">User Management</h1>
          <p className="mt-2 text-sm text-slate-600">Manage students, clients, and platform access.</p>
        </div>
        <div className="flex w-full items-center gap-2 lg:w-auto">
          <div className="relative w-full lg:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-9"
              placeholder="Search users by name, email"
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
          <Button size="icon" variant="outline" aria-label="Filter users">
            <Filter className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Total Users" value={String(allUsersMetaQuery.data || 0)} hint="Akun terdaftar di platform." />
        <MetricCard title="Active Students" value={String(studentUsersMetaQuery.data || 0)} hint="Role student terdaftar." />
        <MetricCard title="Active Clients" value={String(clientUsersMetaQuery.data || 0)} hint="Role client terdaftar." />
        <Card className="rounded-[28px] border-[#efc5c2] bg-[#fdf3f2]">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-[#8f1f1d]">Pending Verification</p>
            <p className="mt-3 text-3xl font-bold text-[#8f1f1d]">{String(verificationsQuery.data?.length || 0)}</p>
            <p className="mt-2 text-sm text-[#b3261e]">Review Now →</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-white/70">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={roleFilter === "all" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => {
                setRoleFilter("all");
                setPage(1);
              }}
            >
              All
            </Button>
            <Button
              variant={roleFilter === "student" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => {
                setRoleFilter("student");
                setPage(1);
              }}
            >
              Students
            </Button>
            <Button
              variant={roleFilter === "client" ? "default" : "outline"}
              className="rounded-full"
              onClick={() => {
                setRoleFilter("client");
                setPage(1);
              }}
            >
              Clients
            </Button>
          </div>
          <Button variant="ghost" className="text-primary" onClick={exportCsv}>
            <Download className="mr-2 size-4" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-y bg-[#f4f7f2] text-sm text-slate-500">
                  <th className="px-5 py-3 font-semibold">User</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Joined Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const pending = pendingUserMap.get(user.id);
                  const verification = verificationByUserMap.get(user.id);
                  const ktmPhotoUrl = verification?.ktm_preview_url || pending?.ktm_preview_url || null;

                  let statusLabel = "Active";
                  let statusClass = "text-emerald-700";
                  if (pending) {
                    statusLabel = "Pending Approval";
                    statusClass = "text-amber-700";
                  }
                  if (verification) {
                    statusLabel = "Pending KTM";
                    statusClass = "text-red-600";
                  }
                  if (user.role === "student" && user.is_student_verified && !pending) {
                    statusLabel = "Verified";
                    statusClass = "text-emerald-700";
                  }

                  return (
                    <tr key={user.id} className="border-b last:border-b-0 hover:bg-[#f8fbf5]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={getAvatarUrl(user.full_name)}
                            alt={user.full_name}
                            className="size-10 rounded-full border border-[#d7e2d2] object-cover"
                          />
                          <div>
                            <p className="font-semibold text-slate-900">{user.full_name}</p>
                            <p className="text-sm text-slate-600">{user.email}</p>
                            {ktmPhotoUrl ? (
                              <a
                                href={ktmPhotoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={ktmPhotoUrl} alt="KTM preview" className="size-6 rounded border border-[#d7e2d2] object-cover" />
                                Lihat foto KTM
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="rounded-full bg-[#eef2e9] px-3 py-1 text-xs capitalize text-slate-700">{user.role}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-2 text-sm font-medium ${statusClass}`}>
                          <span className="size-2 rounded-full bg-current" />
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">{formatDate(user.created_at)}</td>
                      <td className="px-5 py-4 text-right">
                        {verification ? (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveVerificationMutation.mutate(verification.id)}
                              disabled={approveVerificationMutation.isPending}
                            >
                              Review Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectVerificationMutation.mutate(verification.id)}
                              disabled={rejectVerificationMutation.isPending}
                            >
                              Review Reject
                            </Button>
                          </div>
                        ) : pending ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => approveUserMutation.mutate(user.id)} disabled={approveUserMutation.isPending}>
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectUserMutation.mutate(user.id)}
                              disabled={rejectUserMutation.isPending}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t px-5 py-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
            <span>
              Showing {(meta?.total || 0) === 0 ? 0 : (page - 1) * (meta?.limit || 10) + 1} to {Math.min(page * (meta?.limit || 10), meta?.total || 0)} of {meta?.total || 0} entries
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white">{page}</span>
              <Button
                size="icon"
                variant="outline"
                disabled={page >= (meta?.total_pages || 1)}
                onClick={() => setPage((current) => current + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div ref={verificationSectionRef} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Pending KTM Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(verificationsQuery.data || []).slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-3xl border border-[#d7e2d2] bg-[#fbfdf9] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getAvatarUrl(item.users.full_name)}
                      alt={item.users.full_name}
                      className="size-10 rounded-full border border-[#d7e2d2] object-cover"
                    />
                    <div>
                    <p className="text-lg font-semibold text-slate-900">{item.users.full_name}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.users.email}</p>
                    <p className="mt-2 text-xs text-slate-500">Dikirim {formatDateTime(item.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approveVerificationMutation.mutate(item.id)} disabled={approveVerificationMutation.isPending}>
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => rejectVerificationMutation.mutate(item.id)}
                      disabled={rejectVerificationMutation.isPending}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
                {item.ktm_preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.ktm_preview_url} alt={item.users.full_name} className="mt-4 h-48 w-full rounded-3xl object-cover" />
                ) : null}
              </div>
            ))}
            {verificationsQuery.data?.length === 0 ? (
              <p className="text-sm text-slate-600">Tidak ada pengajuan verifikasi yang menunggu review.</p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Recent Audit Trail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(auditQuery.data || []).slice(0, 5).map((log) => (
              <div key={log.id} className="rounded-3xl border border-[#d7e2d2] px-4 py-4">
                <p className="font-semibold capitalize text-slate-900">{log.action.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm text-slate-600">{formatDateTime(log.created_at)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: fetchMe,
  });

  if (!meQuery.data?.profile) {
    return <div className="glass-panel p-8 text-center text-sm text-slate-600">Memuat dashboard...</div>;
  }

  if (meQuery.data.profile.role === "admin") return <AdminDashboard />;
  if (meQuery.data.profile.role === "client") return <ClientDashboard profile={meQuery.data.profile} />;
  return <StudentDashboard profile={meQuery.data.profile} />;
}
