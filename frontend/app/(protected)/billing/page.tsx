"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchPayments } from "@/utils/fetchers";
import { formatCurrency, formatDateTime } from "@/utils/formatters";
import type { PaymentRecord } from "@/types/payment";

export default function BillingPage() {
  const paymentsQuery = useQuery({
    queryKey: ["payments"],
    queryFn: () => fetchPayments(),
  });

  const payments = paymentsQuery.data || [];
  const totalPaid = payments.reduce((acc, item: PaymentRecord) => {
    if (item.status === "paid") acc += Number(item.amount || 0);
    return acc;
  }, 0);
  const totalFees = payments.reduce((acc, item: PaymentRecord) => acc + Number(item.platform_fee || 0), 0);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary/70">Payments & Billing</p>
        <h2 className="mt-4 text-4xl font-bold text-slate-950">Riwayat transaksi simulasi micro-milestone.</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[28px] border-white/70">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Total Paid</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{formatCurrency(totalPaid)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/70">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Platform Fees</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{formatCurrency(totalFees)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-[28px] border-white/70">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Transactions</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{payments.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[28px] border-white/70">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-3xl border border-[#d7e2d2] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{payment.projects?.title || "Project"}</p>
                  <p className="mt-1 text-sm text-slate-600">{payment.milestones?.title || "Milestone"}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-950">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs capitalize text-slate-500">{payment.status}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                <span>{payment.projects?.city || "Remote"}</span>
                <span>•</span>
                <span>{formatDateTime(payment.created_at)}</span>
                <span>•</span>
                <span>Fee {formatCurrency(payment.platform_fee)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
