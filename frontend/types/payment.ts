import type { Payment } from "@/types/project";

export type PaymentRecord = Payment & {
  milestones?: {
    id: string;
    title: string;
    due_date: string | null;
  } | null;
  projects?: {
    id: string;
    title: string;
    city: string | null;
    category: string | null;
    status: string;
  } | null;
};
