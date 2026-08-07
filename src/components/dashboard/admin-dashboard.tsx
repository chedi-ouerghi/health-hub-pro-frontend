import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  LayoutDashboard,
  MapPin,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useAppointmentsQuery } from "@/hooks/api/use-appointments";
import { useInvoicesQuery, useMarkInvoicePaidMutation } from "@/hooks/api/use-invoices";
import { useDoctorsQuery } from "@/hooks/api/use-doctors";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_META: { key: string; label: string; className: string }[] = [
  { key: "UPCOMING", label: "Upcoming", className: "bg-primary" },
  { key: "COMPLETED", label: "Completed", className: "bg-success" },
  { key: "CANCELLED", label: "Cancelled", className: "bg-destructive/70" },
  { key: "NO_SHOW", label: "No-show", className: "bg-warning" },
  { key: "RESCHEDULED", label: "Rescheduled", className: "bg-muted-foreground/60" },
];

function isSameDay(date: Date, ref: Date) {
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth() &&
    date.getDate() === ref.getDate()
  );
}

export function AdminDashboard() {
  const userQuery = useCurrentUserQuery();
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const invoicesQuery = useInvoicesQuery({ limit: 100 });
  const doctorsQuery = useDoctorsQuery({ limit: 100 });
  const markPaid = useMarkInvoicePaidMutation();
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "PENDING" | "PAID">("all");

  const loading = appointmentsQuery.isPending || invoicesQuery.isPending || userQuery.isPending;

  const currency = invoicesQuery.data?.data?.[0]?.currency ?? "EUR";
  const money = (value: number) => `${currency === "EUR" ? "€" : "$"}${value.toFixed(2)}`;

  const todayCount = useMemo(() => {
    const now = new Date();
    return (appointmentsQuery.data?.data ?? []).filter((a) =>
      isSameDay(new Date(a.scheduledAt), now),
    ).length;
  }, [appointmentsQuery.data]);

  const upcomingCount = useMemo(
    () => (appointmentsQuery.data?.data ?? []).filter((a) => a.status === "UPCOMING").length,
    [appointmentsQuery.data],
  );

  const completedCount = useMemo(
    () => (appointmentsQuery.data?.data ?? []).filter((a) => a.status === "COMPLETED").length,
    [appointmentsQuery.data],
  );

  const patientsServed = useMemo(
    () =>
      new Set((appointmentsQuery.data?.data ?? []).map((a) => a.patient?.id).filter(Boolean)).size,
    [appointmentsQuery.data],
  );

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of appointmentsQuery.data?.data ?? [])
      counts[a.status] = (counts[a.status] ?? 0) + 1;
    return STATUS_META.map((s) => ({
      ...s,
      count: counts[s.key] ?? 0,
    }));
  }, [appointmentsQuery.data]);

  const totalStatuses = statusCounts.reduce((sum, s) => sum + s.count, 0);

  const pendingInvoices = useMemo(
    () => (invoicesQuery.data?.data ?? []).filter((i) => i.status === "PENDING").length,
    [invoicesQuery.data],
  );

  const revenue = useMemo(
    () =>
      (invoicesQuery.data?.data ?? [])
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + Number(i.amount), 0),
    [invoicesQuery.data],
  );

  const filteredInvoices = useMemo(() => {
    return (invoicesQuery.data?.data ?? []).filter((i) =>
      invoiceFilter === "all" ? true : i.status === invoiceFilter,
    );
  }, [invoicesQuery.data, invoiceFilter]);

  const topDoctors = useMemo(
    () =>
      [...(doctorsQuery.data?.data ?? [])]
        .sort((a, b) => Number(b.ratingAverage) - Number(a.ratingAverage))
        .slice(0, 6),
    [doctorsQuery.data],
  );

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-5">
        <Skeleton className="col-span-12 h-56 rounded-3xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="col-span-3 h-40 rounded-3xl" />
        ))}
        <Skeleton className="col-span-12 h-24 rounded-3xl" />
        <Skeleton className="col-span-12 h-96 rounded-3xl" />
      </div>
    );
  }

  const recent = (appointmentsQuery.data?.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, 8);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.section
        variants={fadeUp}
        className="overflow-hidden rounded-3xl gradient-teal p-8 shadow-glow"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium text-primary-foreground">
          <ShieldCheck className="size-3" /> Platform overview
        </span>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-primary-foreground">
          Admin dashboard
        </h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/80">
          {(appointmentsQuery.data?.data ?? []).length} appointments · {pendingInvoices} pending
          invoices · {money(revenue)} collected across {(doctorsQuery.data?.data ?? []).length}{" "}
          doctors.
        </p>
      </motion.section>

      <div className="grid grid-cols-12 gap-5">
        {[
          { label: "Appointments today", value: String(todayCount), icon: CalendarDays },
          { label: "Upcoming", value: String(upcomingCount), icon: CalendarDays },
          { label: "Completed", value: String(completedCount), icon: CheckCircle2 },
          { label: "Patients served", value: String(patientsServed), icon: Users },
          { label: "Revenue (paid)", value: money(revenue), icon: Banknote },
          { label: "Pending invoices", value: String(pendingInvoices), icon: CreditCard },
          {
            label: "Doctors",
            value: String((doctorsQuery.data?.data ?? []).length),
            icon: Stethoscope,
          },
          { label: "Platform", value: "Live", icon: LayoutDashboard },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            className="col-span-3 rounded-3xl border border-border bg-card p-6 shadow-sm"
          >
            <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
              <stat.icon className="size-5" />
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.section
        variants={fadeUp}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">Appointment status</h3>
            <p className="text-sm text-muted-foreground">Distribution across all appointments.</p>
          </div>
          <span className="text-sm text-muted-foreground">{totalStatuses} total</span>
        </div>
        <div className="mt-5 flex h-4 w-full gap-1 overflow-hidden rounded-full">
          {totalStatuses > 0 &&
            statusCounts.map(
              (s) =>
                s.count > 0 && (
                  <div
                    key={s.key}
                    className={cn("h-full transition-all", s.className)}
                    style={{ width: `${(s.count / totalStatuses) * 100}%` }}
                  />
                ),
            )}
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {statusCounts.map((s) => (
            <span key={s.key} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn("size-2.5 rounded-full", s.className)} />
              {s.label}
              <span className="font-semibold text-foreground">{s.count}</span>
            </span>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-12 gap-5">
        <motion.section
          variants={fadeUp}
          className="col-span-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Top doctors</h3>
              <p className="text-sm text-muted-foreground">Best rated on the platform.</p>
            </div>
            <Button asChild variant="outline" className="h-9 rounded-2xl">
              <Link to="/doctors">All doctors</Link>
            </Button>
          </div>
          {topDoctors.length > 0 ? (
            <ul className="mt-5 divide-y divide-border">
              {topDoctors.map((d) => (
                <li key={d.id} className="flex items-center gap-3 py-3">
                  {d.photoUrl ? (
                    <img
                      src={d.photoUrl}
                      alt=""
                      loading="lazy"
                      className="size-10 rounded-2xl object-cover"
                    />
                  ) : (
                    <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-xs font-semibold">
                      {d.firstName[0]}
                      {d.lastName[0]}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      Dr. {d.firstName} {d.lastName}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {d.city}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Star className="size-3.5 fill-warning text-warning" />
                    {Number(d.ratingAverage).toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No doctors yet.</p>
          )}
        </motion.section>

        <motion.section
          variants={fadeUp}
          className="col-span-8 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                <LayoutDashboard className="size-4 text-primary" /> Recent appointments
              </h3>
              <p className="text-sm text-muted-foreground">All appointments across the platform.</p>
            </div>
            <Button asChild variant="outline" className="h-9 rounded-2xl">
              <Link to="/appointments">Manage</Link>
            </Button>
          </div>
          {recent.length > 0 ? (
            <ul className="mt-5 divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Users className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "Patient"} →{" "}
                      {a.doctor ? `Dr. ${a.doctor.firstName} ${a.doctor.lastName}` : "Doctor"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.scheduledAt).toLocaleString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}{" "}
                      · {a.status.toLowerCase()}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No appointments yet.</p>
          )}
        </motion.section>
      </div>

      <motion.section
        variants={fadeUp}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Banknote className="size-4 text-primary" /> Invoices
            </h3>
            <p className="text-sm text-muted-foreground">Mark invoices as paid.</p>
          </div>
          <div className="flex gap-1 rounded-2xl bg-muted p-1">
            {(["all", "PENDING", "PAID"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setInvoiceFilter(f)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
                  invoiceFilter === f
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        {filteredInvoices.length > 0 ? (
          <ul className="mt-5 divide-y divide-border">
            {filteredInvoices.slice(0, 8).map((inv) => (
              <li key={inv.id} className="flex items-center gap-4 py-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <CreditCard className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.appointment?.patient
                      ? `${inv.appointment.patient.firstName} ${inv.appointment.patient.lastName}`
                      : "Patient"}{" "}
                    · {inv.status.toLowerCase()}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  {inv.currency === "EUR" ? "€" : "$"}
                  {Number(inv.amount).toFixed(2)}
                </span>
                {inv.status === "PENDING" && (
                  <Button
                    size="sm"
                    className="h-8 rounded-xl"
                    onClick={() =>
                      markPaid.mutate(inv.id, {
                        onSuccess: () => toast.success("Invoice marked as paid"),
                        onError: (err) =>
                          toast.error("Failed to mark paid", {
                            description: err instanceof Error ? err.message : undefined,
                          }),
                      })
                    }
                    disabled={markPaid.isPending}
                  >
                    Mark paid
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">No invoices match this filter.</p>
        )}
      </motion.section>
    </motion.div>
  );
}
