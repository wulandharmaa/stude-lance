"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import apiClient from "@/utils/apiClient";
import type { ApiResponse } from "@/types/api";
import type { StudentVerification } from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const statusCopy: Record<string, { label: string; tone: string; icon: typeof ShieldCheck }> = {
  not_submitted: { label: "Belum ada pengajuan", tone: "text-slate-600", icon: ShieldAlert },
  pending: { label: "Menunggu review admin", tone: "text-amber-600", icon: ShieldAlert },
  approved: { label: "Terverifikasi", tone: "text-emerald-600", icon: ShieldCheck },
  rejected: { label: "Ditolak", tone: "text-red-600", icon: ShieldAlert },
};

export default function KtmVerificationCard() {
  const [file, setFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["ktm-status"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StudentVerification | null>>("/api/student/verifications");
      return res.data.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pilih file KTM terlebih dahulu.");
      const formData = new FormData();
      formData.append("ktm_image", file);
      const res = await apiClient.post<ApiResponse<StudentVerification>>("/api/student/verifications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("KTM berhasil dikirim untuk review admin.");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["ktm-status"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const status = statusQuery.data?.status ?? "not_submitted";
  const tone = statusCopy[status] || statusCopy.not_submitted;

  return (
    <Card className="rounded-[28px] border-white/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-[#edf6e8] text-primary">
            <BadgeCheck className="size-5" />
          </span>
          KTM Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-3xl bg-[#f7fbf4] p-4">
          <div className="flex items-center gap-3">
            <tone.icon className={`size-5 ${tone.tone}`} />
            <p className={`font-semibold ${tone.tone}`}>{tone.label}</p>
          </div>
          {statusQuery.data?.rejection_reason ? (
            <p className="mt-3 text-sm text-red-600">Catatan admin: {statusQuery.data.rejection_reason}</p>
          ) : (
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Upload foto KTM yang jelas agar akun mahasiswa bisa diaktifkan untuk apply project.
            </p>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || !file}>
            {uploadMutation.isPending ? "Uploading..." : "Upload KTM"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
