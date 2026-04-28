export type UserRole = "admin" | "student" | "client";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  city: string | null;
  university_name: string | null;
  major: string | null;
  about: string | null;
  skills: string[];
  avatar_url: string | null;
  email_verified_at: string | null;
  is_active: boolean;
  account_status: "pending" | "approved" | "rejected";
  account_rejection_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  is_student_verified: boolean;
  ktm_image_url: string | null;
  created_at?: string;
};

export type AuthPayload = {
  auth_user: {
    id: string;
    email: string;
    created_at: string;
  };
  profile: UserProfile;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  role: "client" | "student" | "mentor" | "admin";
  created_at: string;
  user: UserProfile | null;
};

export type ProjectApplication = {
  id: string;
  project_id: string;
  student_id: string;
  proposal: string;
  proposed_budget: number | null;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  updated_at: string;
  student: UserProfile | null;
};

export type Payment = {
  id: string;
  milestone_id: string;
  project_id: string;
  amount: number;
  platform_fee: number;
  status: "pending" | "approved" | "paid" | "failed";
  notes: string | null;
  created_at: string;
};

export type Milestone = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: "pending" | "funded" | "working" | "approved" | "paid";
  created_at: string;
  payments?: Payment[];
};

export type ProjectFile = {
  id: string;
  project_id: string;
  uploader_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  mime_type: string | null;
  created_at: string;
  download_url?: string | null;
  uploader: UserProfile | null;
};

export type ProjectMessage = {
  id: string;
  project_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: UserProfile | null;
};

export type Project = {
  id: string;
  client_id: string;
  student_id: string | null;
  title: string;
  description: string | null;
  project_image_url?: string | null;
  budget: number;
  city: string | null;
  category: string | null;
  deadline: string | null;
  status: "open" | "in_progress" | "completed";
  created_at: string;
  client: UserProfile | null;
  assigned_student: UserProfile | null;
  members: ProjectMember[];
  milestones: Milestone[];
  applications: ProjectApplication[];
  my_application: ProjectApplication | null;
  messages: ProjectMessage[];
  files: ProjectFile[];
  payments: Payment[];
  payment_summary: {
    total_amount: number;
    total_fee: number;
    paid_amount: number;
    pending_amount: number;
    approved_amount: number;
  };
  counts: {
    milestones: number;
    applications: number;
    files: number;
    messages: number;
  };
  permissions: {
    is_member: boolean;
    can_manage_project: boolean;
    can_apply: boolean;
    can_message: boolean;
    can_upload_files: boolean;
  };
  requires_verification?: boolean;
};

export type PaginatedProjects = {
  items: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
};
