"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import KtmVerificationCard from "@/components/ktm/KtmVerificationCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

type AuditLog = {
  id: string;
  action: string;
  created_at: string;
  payload: Record<string, string>;
};

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
          <Button asChild>
            <Link href="/projects/create">Post a New Project</Link>
          </Button>
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
  const queryClient = useQueryClient();
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

  const approveMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      await apiClient.patch(`/api/admin/verifications/${verificationId}/approve`);
    },
    onSuccess: () => {
      toast.success("Verifikasi mahasiswa disetujui.");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (verificationId: string) => {
      await apiClient.patch(`/api/admin/verifications/${verificationId}/reject`, {
        reason: "Perlu revisi dokumen KTM sebelum disetujui.",
      });
    },
    onSuccess: () => {
      toast.success("Verifikasi mahasiswa ditolak.");
      queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-audit"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Admin Console</p>
        <h2 className="mt-4 text-4xl font-bold text-slate-950">Moderasi akun dan kualitas marketplace.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          Fokus utama admin adalah verifikasi mahasiswa, audit trail keputusan, dan menjaga account activation tetap
          konsisten dengan PRD.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          title="Pending Verification"
          value={String(verificationsQuery.data?.length || 0)}
          hint="Pengajuan KTM yang menunggu keputusan."
        />
        <MetricCard
          title="Audit Events"
          value={String(auditQuery.data?.length || 0)}
          hint="Log aktivitas admin terbaru."
        />
        <MetricCard title="Safety Mode" value="Manual" hint="Semua approval masih diputuskan oleh admin." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[28px] border-white/70">
          <CardHeader>
            <CardTitle>Pending KTM Reviews</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(verificationsQuery.data || []).map((item) => (
              <div key={item.id} className="rounded-3xl border border-[#d7e2d2] bg-[#fbfdf9] p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{item.users.full_name}</p>
                    <p className="mt-1 text-sm text-slate-600">{item.users.email}</p>
                    <p className="mt-2 text-xs text-slate-500">Dikirim {formatDateTime(item.created_at)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => approveMutation.mutate(item.id)} disabled={approveMutation.isPending}>
                      Approve
                    </Button>
                    <Button variant="outline" onClick={() => rejectMutation.mutate(item.id)} disabled={rejectMutation.isPending}>
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
