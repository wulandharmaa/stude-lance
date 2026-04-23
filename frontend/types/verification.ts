export type VerificationStatus = "pending" | "approved" | "rejected";

export type StudentVerification = {
  id: string;
  status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
};