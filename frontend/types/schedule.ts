export type ScheduleItem = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  type: "academic" | "exam" | "project_deadline";
  start_time: string;
  end_time: string;
  created_at: string;
};
