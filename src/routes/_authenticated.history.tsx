import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CalendarClock, Download, Eye, RefreshCcw, Search } from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useAppointmentsQuery } from "@/hooks/api/use-appointments";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import type { AppointmentStatus } from "@/types/appointment.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title: "Appointment History — MediCare" },
      {
        name: "description",
        content:
          "Review upcoming, completed, cancelled and rescheduled consultations in one timeline.",
      },
      { property: "og:title", content: "Appointment History — MediCare" },
      {
        property: "og:description",
        content: "A complete timeline of your consultations, notes and invoices.",
      },
    ],
  }),
  component: HistoryPage,
});

const filters: { key: AppointmentStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "UPCOMING", label: "Upcoming" },
  { key: "COMPLETED", label: "Completed" },
  { key: "CANCELLED", label: "Cancelled" },
  { key: "RESCHEDULED", label: "Rescheduled" },
  { key: "NO_SHOW", label: "No-show" },
];

const statusStyles: Record<AppointmentStatus, string> = {
  UPCOMING: "bg-primary-soft text-primary",
  COMPLETED: "bg-success/12 text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  RESCHEDULED: "bg-warning/15 text-warning-foreground",
  NO_SHOW: "bg-muted text-muted-foreground",
};

type AppointmentRow = NonNullable<ReturnType<typeof useAppointmentsQuery>["data"]>["data"][number];

function HistoryPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<AppointmentStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [details, setDetails] = useState<AppointmentRow | null>(null);

  const appointmentsQuery = useAppointmentsQuery(
    status === "all" ? { limit: 100 } : { status, limit: 100 },
  );
  const userQuery = useCurrentUserQuery();
  const isDoctor = userQuery.data?.role === "DOCTOR";
  const isAdmin = userQuery.data?.role === "ADMIN" || userQuery.data?.role === "SUPER_ADMIN";

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (appointmentsQuery.data?.data ?? []).filter((a) => {
      if (!q) return true;
      const doctor = a.doctor ? `${a.doctor.firstName} ${a.doctor.lastName}`.toLowerCase() : "";
      const patient = a.patient ? `${a.patient.firstName} ${a.patient.lastName}`.toLowerCase() : "";
      return `${doctor} ${patient} ${a.id}`.toLowerCase().includes(q);
    });
  }, [appointmentsQuery.data, query]);

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Appointment history</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {list.length} consultations · notes, invoices and rebooking in one place
            </p>
          </div>
          <div className="relative w-80">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                isDoctor ? "Search by patient or reference…" : "Search by doctor or reference…"
              }
              aria-label="Search appointments"
              className="h-11 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setStatus(filter.key)}
              className={cn(
                "rounded-full border px-4 py-2 text-xs font-medium transition-all",
                status === filter.key
                  ? "border-transparent gradient-teal text-primary-foreground shadow-glow"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {appointmentsQuery.isPending ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 rounded-3xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="surface-card grid place-items-center py-24 text-center"
          >
            <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
              <CalendarClock className="size-6 text-primary" />
            </span>
            <p className="mt-5 text-base font-semibold">No appointments found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try another filter or clear your search.
            </p>
          </motion.div>
        ) : (
          <ol className="relative space-y-4 pl-10">
            <span className="absolute left-[15px] top-4 bottom-4 w-px bg-border" aria-hidden />
            {list.map((appointment) => {
              const doctor = appointment.doctor;
              const patient = appointment.patient;
              const title = isDoctor
                ? patient
                  ? `${patient.firstName} ${patient.lastName}`
                  : "Patient"
                : doctor
                  ? `${doctor.firstName} ${doctor.lastName}`
                  : "Doctor";
              return (
                <motion.li key={appointment.id} variants={fadeUp} className="relative">
                  <span className="absolute -left-10 top-6 grid size-8 place-items-center rounded-full border border-border bg-card">
                    <span
                      className={cn(
                        "size-2.5 rounded-full",
                        appointment.status === "COMPLETED"
                          ? "bg-success"
                          : appointment.status === "CANCELLED"
                            ? "bg-destructive"
                            : appointment.status === "RESCHEDULED" ||
                              appointment.status === "NO_SHOW"
                              ? "bg-warning"
                              : "bg-primary",
                      )}
                    />
                  </span>
                  <div className="surface-card p-6">
                    <div className="flex items-start gap-4">
                      {doctor?.photoUrl && !isDoctor && (
                        <img
                          src={doctor.photoUrl}
                          alt=""
                          loading="lazy"
                          className="size-14 rounded-2xl object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <p className="text-base font-semibold">{title}</p>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                              statusStyles[appointment.status],
                            )}
                          >
                            {appointment.status.toLowerCase()}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            {appointment.id}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
                            weekday: "short",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}{" "}
                          ·{" "}
                          {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}{" "}
                          · {appointment.clinicAddressSnapshot}
                        </p>
                        {appointment.notes && (
                          <p className="mt-3 rounded-2xl bg-muted/60 p-3.5 text-xs leading-relaxed text-muted-foreground">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className="flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold text-primary">
                          In-clinic
                        </span>
                        <p className="text-lg font-semibold">
                          ${Number(appointment.price).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex justify-end gap-2 border-t border-border pt-5">
                      <Button
                        variant="outline"
                        className="h-10 rounded-2xl"
                        onClick={() => setDetails(appointment)}
                      >
                        <Eye className="size-4" /> View details
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-2xl"
                        onClick={() =>
                          toast.success(
                            `Invoice ${appointment.invoice?.invoiceNumber ?? "—"} downloaded`,
                          )
                        }
                      >
                        <Download className="size-4" /> Invoice
                      </Button>
                      {doctor && userQuery.data?.role === "PATIENT" && (
                        <Button
                          className="h-10 rounded-2xl"
                          onClick={() =>
                            navigate({
                              to: "/find-doctor/$doctorId",
                              params: { doctorId: doctor.id },
                            })
                          }
                        >
                          <RefreshCcw className="size-4" /> Rebook
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        )}
      </motion.div>

      <Dialog open={Boolean(details)} onOpenChange={(open) => !open && setDetails(null)}>
        <DialogContent className="rounded-3xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {details
                ? isDoctor
                  ? details.patient
                    ? `${details.patient.firstName} ${details.patient.lastName}`
                    : "Patient"
                  : details.doctor
                    ? `${details.doctor.firstName} ${details.doctor.lastName}`
                    : "Appointment"
                : "Appointment"}
            </DialogTitle>
            <DialogDescription>
              {details?.clinicAddressSnapshot} · {details?.id}
            </DialogDescription>
          </DialogHeader>
          {details && (
            <>
              {isAdmin ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {details.patient?.photoUrl && (
                        <img
                          src={details.patient.photoUrl}
                          alt=""
                          loading="lazy"
                          className="size-14 rounded-2xl object-cover"
                        />
                      )}
                      <div>
                        <p className="text-base font-semibold">
                          {details.patient ? `${details.patient.firstName} ${details.patient.lastName}` : "Patient"}
                        </p>
                        <p className="text-sm text-muted-foreground">Patient ID: {details.patient?.id ?? "—"}</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-card p-4">
                      <p className="text-sm text-muted-foreground">Clinic</p>
                      <p className="font-medium">{details.clinicAddressSnapshot}</p>
                    </div>

                    <div className="space-y-2">
                      <dt className="text-muted-foreground">Notes</dt>
                      <dd className="rounded-2xl bg-muted/60 p-3 text-sm leading-relaxed text-muted-foreground">
                        {details.notes ?? "—"}
                      </dd>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Doctor</p>
                        <p className="font-medium">
                          {details.doctor ? `${details.doctor.firstName} ${details.doctor.lastName}` : "Doctor"}
                        </p>
                        <p className="text-sm text-muted-foreground">Doctor ID: {details.doctor?.id ?? "—"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Amount</p>
                        <p className="text-lg font-semibold">${Number(details.price).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">{details.status.toLowerCase()}</p>
                      </div>
                    </div>

                    <dl className="space-y-2.5 text-sm">
                      {(
                        [
                          [
                            "Scheduled",
                            new Date(details.scheduledAt).toLocaleString("en-US", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }),
                          ],
                          ["Duration", `${details.durationMinutes} minutes`],
                          ["Status", details.status.toLowerCase()],
                          ["Invoice #", details.invoice?.invoiceNumber ?? "—"],
                          ["Invoice status", details.invoice?.status ?? "—"],
                          ["Invoice paid at", details.invoice?.paidAt ? new Date(details.invoice.paidAt).toLocaleString() : "—"],
                          ["Created at", details.createdAt ? new Date(details.createdAt).toLocaleString() : "—"],
                        ] as [string, string][]
                      ).map(([label, value]) => (
                        <div key={label} className="flex justify-between">
                          <dt className="text-muted-foreground">{label}</dt>
                          <dd className="font-medium capitalize text-right">{value}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </div>
              ) : (
                <>
                  <dl className="space-y-2.5 text-sm">
                    {(
                      [
                        [
                          "Date",
                          new Date(details.scheduledAt).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }),
                        ],
                        ["Type", "In-clinic"],
                        ["Status", details.status.toLowerCase()],
                        ["Invoice", details.invoice?.invoiceNumber ?? "—"],
                        ["Amount", `$${Number(details.price).toFixed(2)}`],
                      ] as [string, string][]
                    ).map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-medium capitalize">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {details.notes && (
                    <p className="rounded-2xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
                      {details.notes}
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
