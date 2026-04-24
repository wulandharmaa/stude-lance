export type VerificationStatus = "pending" | "approved" | "rejected";

export type StudentVerification = {
  id: string;
  user_id?: string;
  ktm_image?: string;
  status: VerificationStatus;
  rejection_reason: string | null;
  verified_by?: string | null;
  verified_at?: string | null;
  created_at: string;
};