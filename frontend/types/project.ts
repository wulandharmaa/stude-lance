export type ProjectMember = {
  id: string;
  user_id: string;
  role: "student" | "mentor";
};

export type Milestone = {
  id: string;
  project_id: string;
  title: string;
  amount: number;
  due_date: string | null;
  status: "pending" | "working" | "approved";
};

export type Project = {
  id: string;
  title: string;
  status: "open" | "in_progress" | "completed";
  project_members?: ProjectMember[];
  milestones?: Milestone[];
};