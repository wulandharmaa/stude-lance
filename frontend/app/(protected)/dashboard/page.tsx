"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
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
    import { useMemo } from "react";
    import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
    },
  });

  return (
    import { StudentVerification } from "@/types/verification";
    import { toast } from "sonner";
    import { Button } from "@/components/ui/button";
    <div className="space-y-6">
      <div>
    type UserRole = "admin" | "client" | "student";

    type AuthMeResponse = {
      message: string;
      data: {
        auth_user: {
          id: string;
          email: string;
          created_at: string;
        };
        profile: {
          id: string;
          email: string;
          full_name: string;
          role: UserRole;
          account_status: string;
          is_student_verified: boolean;
          is_active: boolean;
        };
      };
    };

    type AdminUser = {
      id: string;
      email: string;
      full_name: string;
      role: "student" | "client" | "admin";
      is_student_verified: boolean;
      account_status: "pending" | "approved" | "rejected";
      is_active: boolean;
    };

    type PendingUser = {
      id: string;
      email: string;
      full_name: string;
      role: "student" | "client" | "admin";
      created_at: string;
    };

    type PendingVerification = StudentVerification & {
      user_id: string;
      users?: {
        id: string;
        full_name: string;
        email: string;
      };
    };

        <h2 className="text-2xl font-semibold">Dashboard</h2>
      const queryClient = useQueryClient();

      const meQuery = useQuery({
        queryKey: ["auth-me"],
        queryFn: async () => {
          const res = await apiClient.get<AuthMeResponse>("/api/auth/me");
          return res.data.data;
        },
      });

      const role = meQuery.data?.profile.role;

        <p className="text-sm text-muted-foreground">Ringkasan aktivitas akun dan project Anda.</p>
      </div>

      <KtmVerificationCard />

      <Card>
        <CardHeader>
        enabled: role === "student" || role === "client",
      });

      const allUsersQuery = useQuery({
        queryKey: ["admin-all-users"],
        queryFn: async () => {
          const res = await apiClient.get<{ data: AdminUser[] }>("/api/users?limit=200");
          return res.data.data || [];
        },
        enabled: role === "admin",
      });

      const pendingUsersQuery = useQuery({
        queryKey: ["admin-pending-users"],
        queryFn: async () => {
          const res = await apiClient.get<ApiResponse<PendingUser[]>>("/api/admin/users/pending");
          if (!res.data.success) throw new Error(res.data.message);
          return res.data.data;
        },
        enabled: role === "admin",
      });

      const pendingVerificationsQuery = useQuery({
        queryKey: ["admin-pending-verifications"],
        queryFn: async () => {
          const res = await apiClient.get<ApiResponse<PendingVerification[]>>("/api/admin/verifications");
          if (!res.data.success) throw new Error(res.data.message);
          return res.data.data;
        },
        enabled: role === "admin",
          <CardTitle>Projects</CardTitle>

      const approveUserMutation = useMutation({
        mutationFn: async (userId: string) => {
          const res = await apiClient.patch<ApiResponse<unknown>>(`/api/admin/users/${userId}/approve`);
          if (!res.data.success) throw new Error(res.data.message);
          return res.data;
        },
        onSuccess: () => {
          toast.success("User berhasil di-approve.");
          queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
        },
        onError: (err: Error) => toast.error(err.message),
      });

      const rejectUserMutation = useMutation({
        mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
          const res = await apiClient.patch<ApiResponse<unknown>>(`/api/admin/users/${userId}/reject`, { reason });
          if (!res.data.success) throw new Error(res.data.message);
          return res.data;
        },
        onSuccess: () => {
          toast.success("User berhasil di-reject.");
          queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
        },
        onError: (err: Error) => toast.error(err.message),
      });

      const approveVerificationMutation = useMutation({
        mutationFn: async (verificationId: string) => {
          const res = await apiClient.patch<ApiResponse<unknown>>(`/api/admin/verifications/${verificationId}/approve`);
          if (!res.data.success) throw new Error(res.data.message);
          return res.data;
        },
        onSuccess: () => {
          toast.success("Verifikasi berhasil di-approve.");
          queryClient.invalidateQueries({ queryKey: ["admin-pending-verifications"] });
          queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
        },
        onError: (err: Error) => toast.error(err.message),
      });

      const rejectVerificationMutation = useMutation({
        mutationFn: async ({ verificationId, reason }: { verificationId: string; reason: string }) => {
          const res = await apiClient.patch<ApiResponse<unknown>>(`/api/admin/verifications/${verificationId}/reject`, {
            reason,
          });
          if (!res.data.success) throw new Error(res.data.message);
          return res.data;
        },
        onSuccess: () => {
          toast.success("Verifikasi berhasil di-reject.");
          queryClient.invalidateQueries({ queryKey: ["admin-pending-verifications"] });
          queryClient.invalidateQueries({ queryKey: ["admin-pending-users"] });
          queryClient.invalidateQueries({ queryKey: ["admin-all-users"] });
        },
        onError: (err: Error) => toast.error(err.message),
      });

      const adminSummary = useMemo(() => {
        const users = allUsersQuery.data || [];
        const approved = users.filter((u) => u.account_status === "approved").length;
        const pending = users.filter((u) => u.account_status === "pending").length;
        const rejected = users.filter((u) => u.account_status === "rejected").length;
        return { total: users.length, approved, pending, rejected };
      }, [allUsersQuery.data]);

      const renderProjects = () => (
        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectsQuery.isLoading && <p className="text-sm text-muted-foreground">Memuat project...</p>}
            {projectsQuery.isError && <p className="text-red-600">Gagal memuat project.</p>}
            {!projectsQuery.isLoading && !projectsQuery.isError && projectsQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">Belum ada project.</p>
            )}
            <ul className="space-y-2">
              {projectsQuery.data?.map((project) => (
                <li key={project.id} className="rounded-lg border bg-background p-3">
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
      );

      const renderAdminDashboard = () => (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-4">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-primary">{adminSummary.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{adminSummary.approved}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{adminSummary.pending}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Rejected</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{adminSummary.rejected}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Pending Approval Users</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingUsersQuery.isLoading && <p className="text-sm text-muted-foreground">Memuat pending users...</p>}
              {pendingUsersQuery.isError && <p className="text-red-600">Gagal memuat pending users.</p>}
              {!pendingUsersQuery.isLoading && !pendingUsersQuery.isError && pendingUsersQuery.data?.length === 0 && (
                <p className="text-sm text-muted-foreground">Tidak ada user pending.</p>
              )}
              <ul className="space-y-2">
                {pendingUsersQuery.data?.map((user) => (
                  <li key={user.id} className="rounded-lg border p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{user.full_name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.email} • role: {user.role}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveUserMutation.mutate(user.id)}
                          disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = window.prompt("Alasan reject user (minimal 5 karakter):", "");
                            if (!reason) return;
                            rejectUserMutation.mutate({ userId: user.id, reason });
                          }}
                          disabled={approveUserMutation.isPending || rejectUserMutation.isPending}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending KTM Verifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingVerificationsQuery.isLoading && (
                <p className="text-sm text-muted-foreground">Memuat pending verifications...</p>
              )}
              {pendingVerificationsQuery.isError && <p className="text-red-600">Gagal memuat pending verifications.</p>}
              {!pendingVerificationsQuery.isLoading &&
                !pendingVerificationsQuery.isError &&
                pendingVerificationsQuery.data?.length === 0 && (
                  <p className="text-sm text-muted-foreground">Tidak ada verifikasi pending.</p>
                )}
              <ul className="space-y-2">
                {pendingVerificationsQuery.data?.map((verif) => (
                  <li key={verif.id} className="rounded-lg border p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium">{verif.users?.full_name || verif.users?.email || verif.user_id}</p>
                        <p className="text-sm text-muted-foreground">{verif.users?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveVerificationMutation.mutate(verif.id)}
                          disabled={approveVerificationMutation.isPending || rejectVerificationMutation.isPending}
                        >
                          Approve KTM
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const reason = window.prompt("Alasan reject verifikasi (minimal 5 karakter):", "");
                            if (!reason) return;
                            rejectVerificationMutation.mutate({ verificationId: verif.id, reason });
                          }}
                          disabled={approveVerificationMutation.isPending || rejectVerificationMutation.isPending}
                        >
                          Reject KTM
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      );

      const renderClientDashboard = () => (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Workspace</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Anda login sebagai client. Kelola project dan pantau progres student dari dashboard ini.
            </CardContent>
          </Card>
          {renderProjects()}
        </div>
      );

      const renderStudentDashboard = () => (
        <div className="space-y-6">
          <KtmVerificationCard />
          {renderProjects()}
        </div>
      );

        </CardHeader>
        <CardContent className="space-y-3">
          {projectsQuery.isLoading && <p className="text-sm text-muted-foreground">Memuat project...</p>}
            <h2 className="text-2xl font-semibold">
              Dashboard {role ? `(${role})` : ""}
            </h2>
            <p className="text-sm text-muted-foreground">Ringkasan aktivitas akun sesuai role Anda.</p>
            <p className="text-sm text-muted-foreground">Belum ada project.</p>
          )}
          {meQuery.isLoading ? <p className="text-sm text-muted-foreground">Memuat profil...</p> : null}
          {meQuery.isError ? <p className="text-red-600">Gagal memuat profil user.</p> : null}

          {!meQuery.isLoading && !meQuery.isError && role === "admin" ? renderAdminDashboard() : null}
          {!meQuery.isLoading && !meQuery.isError && role === "client" ? renderClientDashboard() : null}
          {!meQuery.isLoading && !meQuery.isError && role === "student" ? renderStudentDashboard() : null}

          {!meQuery.isLoading && !meQuery.isError && !role ? (
            <Card>
              <CardHeader>
                <CardTitle>Role Tidak Dikenali</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Role user belum tersedia. Silakan cek data profile di backend.
              </CardContent>
            </Card>
          ) : null}