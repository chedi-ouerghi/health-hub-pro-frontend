import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarPlus,
  CalendarX2,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  UserX,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import {
  useAppointmentsQuery,
  useCancelAppointmentMutation,
  useUpdateAppointmentStatusMutation,
} from "@/hooks/api/use-appointments";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Appointment } from "@/types/appointment.types";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — MediCare" },
      {
        name: "description",
        content: "View your upcoming in-clinic consultations and manage or cancel bookings.",
      },
    ],
  }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const userQuery = useCurrentUserQuery();
  const role = userQuery.data?.role ?? "PATIENT";

  if (role === "DOCTOR" || role === "ADMIN" || role === "SUPER_ADMIN") {
    return <AgendaView isAdmin={role !== "DOCTOR"} />;
  }

  return <PatientAppointments />;
}

// ── PATIENT view (existing behavior) ───────────────────────────────────────────

function PatientAppointments() {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const cancel = useCancelAppointmentMutation();

  const upcoming = (appointmentsQuery.data?.data ?? [])
    .filter((a) => a.status === "UPCOMING")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = (appointmentsQuery.data?.data ?? [])
    .filter((a) => a.status !== "UPCOMING")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const confirmCancel = (id: string) => {
    setCancelling(id);
    cancel.mutate(id, {
      onSuccess: () => {
        setCancelling(null);
        toast.success("Appointment cancelled");
      },
      onError: (err) => {
        setCancelling(null);
        toast.error("Could not cancel", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      },
    });
  };

  const renderAppointment = (appointment: Appointment) => {
    const doctor = appointment.doctor;
    const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "Doctor";
    return (
      <li key={appointment.id} className="surface-card p-6">
        <div className="flex items-start gap-4">
          {doctor?.photoUrl && (
            <img
              src={doctor.photoUrl}
              alt=""
              loading="lazy"
              className="size-14 rounded-2xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">{doctorName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              ·{" "}
              {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {appointment.clinicAddressSnapshot}
            </p>
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold capitalize text-primary">
            {appointment.status.toLowerCase()}
          </span>
        </div>
        {appointment.status === "UPCOMING" && (
          <div className="mt-5 flex justify-end gap-2 border-t border-border pt-5">
            <Button
              variant="outline"
              className="h-10 rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
              disabled={cancelling === appointment.id}
              onClick={() => confirmCancel(appointment.id)}
            >
              <CalendarX2 className="size-4" />
              {cancelling === appointment.id ? "Cancelling…" : "Cancel appointment"}
            </Button>
          </div>
        )}
      </li>
    );
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">My appointments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {upcoming.length} upcoming · {past.length} past consultations
          </p>
        </div>
        <Button asChild className="h-11 rounded-2xl">
          <Link to="/find-doctor">
            <CalendarPlus className="size-4" /> Book appointment
          </Link>
        </Button>
      </motion.div>

      {appointmentsQuery.isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="surface-card grid place-items-center py-24 text-center"
        >
          <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
            <CalendarPlus className="size-6 text-primary" />
          </span>
          <p className="mt-5 text-base font-semibold">No appointments yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Find a specialist and book your first in-clinic consultation.
          </p>
          <Button asChild className="mt-6 rounded-2xl">
            <Link to="/find-doctor">Find a doctor</Link>
          </Button>
        </motion.div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Upcoming
              </h3>
              <ul className="space-y-4">{upcoming.map(renderAppointment)}</ul>
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Past
              </h3>
              <ul className="space-y-4">{past.map(renderAppointment)}</ul>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
}

// ── DOCTOR / ADMIN agenda view ─────────────────────────────────────────────────

function AgendaView({ isAdmin }: { isAdmin: boolean }) {
  const [busy, setBusy] = useState<string | null>(null);
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const updateStatus = useUpdateAppointmentStatusMutation();

  const upcoming = (appointmentsQuery.data?.data ?? [])
    .filter((a) => a.status === "UPCOMING")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  const past = (appointmentsQuery.data?.data ?? [])
    .filter((a) => a.status !== "UPCOMING")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const run = (id: string, status: "COMPLETED" | "NO_SHOW" | "CANCELLED") => {
    setBusy(id);
    updateStatus.mutate(
      { id, payload: { status } },
      {
        onSuccess: () => {
          setBusy(null);
          toast.success(`Appointment marked as ${status.toLowerCase()}`);
        },
        onError: (err) => {
          setBusy(null);
          toast.error("Update failed", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  const renderRow = (appointment: Appointment) => {
    const patient = appointment.patient;
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Patient";
    const busyThis = busy === appointment.id;
    return (
      <li key={appointment.id} className="surface-card p-6">
        <div className="flex items-start gap-4">
          {patient?.photoUrl && (
            <img
              src={patient.photoUrl}
              alt=""
              loading="lazy"
              className="size-14 rounded-2xl object-cover"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">{patientName}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              {new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              ·{" "}
              {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {appointment.clinicAddressSnapshot}
            </p>
            {appointment.notes && (
              <p className="mt-2 rounded-2xl bg-muted/60 p-3 text-xs text-muted-foreground">
                {appointment.notes}
              </p>
            )}
          </div>
          <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold capitalize text-primary">
            {appointment.status.toLowerCase()}
          </span>
        </div>
        {appointment.patient?.id && (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-5">
            <Button asChild variant="outline" className="h-10 rounded-2xl">
              <Link to="/patients/$patientId" params={{ patientId: appointment.patient!.id }}>
                <Stethoscope className="size-4" />
                Treat patient
              </Link>
            </Button>
            {appointment.status === "UPCOMING" && (
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  className="h-10 rounded-2xl"
                  disabled={busyThis}
                  onClick={() => run(appointment.id, "COMPLETED")}
                >
                  <CheckCircle2 className="size-4" />
                  {busyThis ? "Updating…" : "Mark completed"}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-2xl"
                  disabled={busyThis}
                  onClick={() => run(appointment.id, "NO_SHOW")}
                >
                  <UserX className="size-4" />
                  No-show
                </Button>
                <Button
                  variant="outline"
                  className="h-10 rounded-2xl border-destructive/40 text-destructive hover:bg-destructive/5 hover:text-destructive"
                  disabled={busyThis}
                  onClick={() => run(appointment.id, "CANCELLED")}
                >
                  <CalendarX2 className="size-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h2 className="text-2xl font-semibold tracking-tight">
          {isAdmin ? "Appointments" : "My agenda"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {upcoming.length} upcoming · {past.length} past consultations
        </p>
      </motion.div>

      {appointmentsQuery.isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      ) : upcoming.length === 0 && past.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="surface-card grid place-items-center py-24 text-center"
        >
          <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
            <CalendarPlus className="size-6 text-primary" />
          </span>
          <p className="mt-5 text-base font-semibold">No appointments yet</p>
        </motion.div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                To process
              </h3>
              <ul className="space-y-4">{upcoming.map(renderRow)}</ul>
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Processed
              </h3>
              <ul className="space-y-4">{past.map(renderRow)}</ul>
            </section>
          )}
        </>
      )}
    </motion.div>
  );
}
