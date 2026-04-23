"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/utils/apiClient";
import { ApiResponse } from "@/types/api";
import { StudentVerification } from "@/types/verification";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function KtmVerificationCard() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ["ktm-status"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<StudentVerification | null>>("/api/student-verifications/me");
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Pilih file dulu.");
      const formData = new FormData();
      formData.append("ktm", file);
      const res = await apiClient.post<ApiResponse<StudentVerification>>("/api/student-verifications", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (!res.data.success) throw new Error(res.data.message);
      return res.data.data;
    },
    onSuccess: () => {
      setMessage("Upload KTM berhasil.");
      queryClient.invalidateQueries({ queryKey: ["ktm-status"] });
    },
    onError: (err: Error) => setMessage(err.message),
  });

  const status = statusQuery.data?.status ?? "belum ada";

  return (
    <Card>
      <CardHeader><CardTitle>Verifikasi KTM</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {statusQuery.isLoading && <p>Memuat status verifikasi...</p>}
        {statusQuery.isError && <p className="text-red-600">Gagal memuat status.</p>}
        {!statusQuery.isLoading && <p>Status: <strong>{status}</strong></p>}

        <Input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending}>
          {uploadMutation.isPending ? "Uploading..." : "Upload KTM"}
        </Button>

        {message && <p className="text-sm">{message}</p>}
      </CardContent>
    </Card>
  );
}