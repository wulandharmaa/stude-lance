"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import apiClient from "@/utils/apiClient";
import { fetchSchedules } from "@/utils/fetchers";
import { formatDateTime } from "@/utils/formatters";
import type { ApiResponse } from "@/types/api";
import type { ScheduleItem } from "@/types/schedule";
import { toast } from "sonner";

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: "",
    type: "academic",
    start_time: "",
    end_time: "",
  });

  const schedulesQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: fetchSchedules,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ApiResponse<ScheduleItem>>("/api/schedules", form);
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Jadwal berhasil ditambahkan.");
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setForm({ title: "", type: "academic", start_time: "", end_time: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (scheduleId: string) => {
      await apiClient.delete(`/api/schedules/${scheduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      toast.success("Jadwal dihapus.");
    },
  });

  const grouped = useMemo(() => {
    const items = schedulesQuery.data || [];
    return {
      academic: items.filter((item) => item.type === "academic"),
      exam: items.filter((item) => item.type === "exam"),
      project_deadline: items.filter((item) => item.type === "project_deadline"),
    };
  }, [schedulesQuery.data]);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Academic-Sync Calendar</p>
        <h2 className="mt-4 text-4xl font-bold text-slate-950">Satukan kelas, ujian, dan deadline proyek.</h2>
      </div>

      <Card className="rounded-[28px] border-white/70">
        <CardHeader>
          <CardTitle>Add New Event</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Judul jadwal" value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} />
          <select
            className="h-11 rounded-xl border border-input bg-white px-3 text-sm text-slate-700"
            value={form.type}
            onChange={(e) => setForm((current) => ({ ...current, type: e.target.value }))}
          >
            <option value="academic">Academic</option>
            <option value="exam">Exam</option>
            <option value="project_deadline">Project Deadline</option>
          </select>
          <Input type="datetime-local" value={form.start_time} onChange={(e) => setForm((current) => ({ ...current, start_time: e.target.value }))} />
          <Input type="datetime-local" value={form.end_time} onChange={(e) => setForm((current) => ({ ...current, end_time: e.target.value }))} />
          <Button className="md:col-span-2" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
            Save Event
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {Object.entries(grouped).map(([key, items]) => (
          <Card key={key} className="rounded-[28px] border-white/70">
            <CardHeader>
              <CardTitle className="capitalize">{key.replace("_", " ")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-[#d7e2d2] p-4">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{formatDateTime(item.start_time)}</p>
                  <Button className="mt-3" variant="outline" size="sm" onClick={() => deleteMutation.mutate(item.id)}>
                    Remove
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
