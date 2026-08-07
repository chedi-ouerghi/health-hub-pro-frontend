import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CheckCircle2, CircleDollarSign, CreditCard, ReceiptText } from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useInvoicesQuery, useMarkInvoicePaidMutation } from "@/hooks/api/use-invoices";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({
    meta: [
      { title: "Billing — MediCare" },
      {
        name: "description",
        content: "View your invoices, payment status and consultation charges.",
      },
    ],
  }),
  component: BillingPage,
});

function BillingPage() {
  const [filter, setFilter] = useState<"all" | "PENDING" | "PAID">("all");
  const invoicesQuery = useInvoicesQuery({ limit: 100 });
  const markPaid = useMarkInvoicePaidMutation();
  const userQuery = useCurrentUserQuery();
  const role = userQuery.data?.role;
  const isDoctor = role === "DOCTOR";
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  const invoices = useMemo(() => {
    const list = invoicesQuery.data?.data ?? [];
    if (filter === "all") return list;
    return list.filter((i) => i.status === filter);
  }, [invoicesQuery.data, filter]);

  const totalPending = useMemo(() => {
    return (invoicesQuery.data?.data ?? [])
      .filter((i) => i.status === "PENDING")
      .reduce((sum, i) => sum + Number(i.amount), 0);
  }, [invoicesQuery.data]);

  const pay = (id: string) => {
    markPaid.mutate(id, {
      onSuccess: () => toast.success("Invoice marked as paid"),
      onError: (err) =>
        toast.error("Payment failed", {
          description: err instanceof Error ? err.message : "Please try again.",
        }),
    });
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Billing</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {isDoctor ? "Your consultations and earnings" : "Your invoices and payment history"}
          </p>
        </div>
        <span className="rounded-full bg-primary-soft px-4 py-2 text-xs font-semibold text-primary">
          {totalPending > 0 ? `${totalPending.toFixed(2)} outstanding` : "All settled"}
        </span>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-2">
        {(
          [
            { key: "all", label: "All" },
            { key: "PENDING", label: "Pending" },
            { key: "PAID", label: "Paid" },
          ] as const
        ).map((option) => (
          <button
            key={option.key}
            onClick={() => setFilter(option.key)}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition-all",
              filter === option.key
                ? "border-transparent gradient-teal text-primary-foreground shadow-glow"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </motion.div>

      {invoicesQuery.isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="surface-card grid place-items-center py-24 text-center"
        >
          <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
            <ReceiptText className="size-6 text-primary" />
          </span>
          <p className="mt-5 text-base font-semibold">No invoices found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Invoices are generated after each consultation.
          </p>
        </motion.div>
      ) : (
        <ul className="space-y-4">
          {invoices.map((invoice) => {
            const paid = invoice.status === "PAID";
            return (
              <li key={invoice.id} className="surface-card p-6">
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-2xl",
                      paid ? "bg-success/12 text-success" : "bg-primary-soft text-primary",
                    )}
                  >
                    {paid ? (
                      <CheckCircle2 className="size-5" />
                    ) : (
                      <CircleDollarSign className="size-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold">{invoice.invoiceNumber}</p>
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                          paid
                            ? "bg-success/12 text-success"
                            : "bg-warning/15 text-warning-foreground",
                        )}
                      >
                        {invoice.status.toLowerCase()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {isDoctor
                        ? invoice.appointment?.patient
                          ? `${invoice.appointment.patient.firstName} ${invoice.appointment.patient.lastName}`
                          : "Patient"
                        : invoice.appointment?.doctor
                          ? `${invoice.appointment.doctor.firstName} ${invoice.appointment.doctor.lastName}`
                          : "Consultation"}{" "}
                      ·{" "}
                      {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    {invoice.appointment && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <CreditCard className="size-3" /> In-clinic consultation
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-lg font-semibold">
                      {invoice.currency === "EUR" ? "€" : "$"}
                      {Number(invoice.amount).toFixed(2)}
                    </p>
                    {!paid && !isDoctor && (
                      <Button
                        size="sm"
                        className="h-9 rounded-2xl"
                        disabled={markPaid.isPending}
                        onClick={() => pay(invoice.id)}
                      >
                        {isAdmin ? "Mark paid" : "Pay now"}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}
