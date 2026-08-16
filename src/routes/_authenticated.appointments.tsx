import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarClock,
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
  useRescheduleAppointmentMutation,
} from "@/hooks/api/use-appointments";
import { useDoctorAvailabilitiesQuery } from "@/hooks/api/use-doctors";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Appointment } from "@/types/appointment.types";

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 20; h++) {
  for (const m of ["00", "30"] as const) {
    if (h === 20 && m === "30") continue;
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${m}`);
  }
}

function RescheduleDialog({ appointment }: { appointment: Appointment }) {
  const [date, setDate] = useState<Date | undefined>(() => {
    const d = new Date(appointment.scheduledAt);
    return Number.isNaN(d.getTime()) ? undefined : d;
  });
  const [time, setTime] = useState(() => {
    const d = new Date(appointment.scheduledAt);
    return Number.isNaN(d.getTime())
      ? "09:00"
      : `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const reschedule = useRescheduleAppointmentMutation();

  const userQuery = useCurrentUserQuery();
  const role = userQuery.data?.role ?? "PATIENT";

  const doctorId = appointment.doctor?.id ?? (appointment as any).doctorId;
  const availQuery = useDoctorAvailabilitiesQuery(doctorId || "");
  const allAppointmentsQuery = useAppointmentsQuery();

  const availableSlots = useMemo(() => {
    if (!date || !availQuery.data) return [] as string[];

    const DAY_MAP = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const dayName = DAY_MAP[date.getDay()];

    const matching = availQuery.data.filter((a) => a.dayOfWeek === dayName && a.isActive !== false);
    const slots: string[] = [];
    for (const m of matching) {
      const [sh, sm] = m.startTime.split(":").map(Number);
      const [eh, em] = m.endTime.split(":").map(Number);
      const slotMinutes = m.slotMinutes ?? 30;
      let cur = sh * 60 + sm;
      const end = eh * 60 + em;
      while (cur + slotMinutes <= end) {
        const h = Math.floor(cur / 60);
        const mm = cur % 60;
        const slot = `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
        // if date is today, don't include past times
        const slotDate = new Date(date);
        slotDate.setHours(h, mm, 0, 0);
        if (slotDate.getTime() > Date.now()) {
          slots.push(slot);
        }
        cur += slotMinutes;
      }
    }
    return slots;
  }, [date, availQuery.data]);

  const bookedSet = useMemo(() => {
    if (!date) return new Set<string>();
    if (!(role === "DOCTOR" || role === "ADMIN")) return new Set<string>();

    const appts = allAppointmentsQuery.data?.data ?? [];
    const filtered = appts.filter((a) => {
      if (role === "ADMIN" && a.doctor?.id !== doctorId) return false;
      if (role === "DOCTOR") return true;
      return a.doctor?.id === doctorId;
    });
    const set = new Set<string>();
    for (const a of filtered) {
      const d = new Date(a.scheduledAt);
      if (d.toDateString() !== date.toDateString()) continue;
      const slot = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      set.add(slot);
    }
    return set;
  }, [date, allAppointmentsQuery.data, role, doctorId]);

  const confirm = () => {
    if (!date || !time) return;
    const [h = 0, m = 0] = time.split(":").map(Number);
    const scheduledAt = new Date(date);
    scheduledAt.setHours(h, m, 0, 0);
    if (scheduledAt.getTime() <= Date.now()) {
      toast.error("Invalid date", { description: "Please pick a future date and time." });
      return;
    }
    reschedule.mutate(
      { id: appointment.id, payload: { scheduledAt: scheduledAt.toISOString() } },
      {
        onSuccess: () => toast.success("Appointment rescheduled"),
        onError: (err) =>
          toast.error("Could not reschedule", {
            description: err instanceof Error ? err.message : "Please try again.",
          }),
      },
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="h-10 rounded-2xl">
          <CalendarClock className="size-4" />
          Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>
            Choose a new date and time for this consultation. Both you and the doctor will be
            notified.
          </DialogDescription>
        </DialogHeader>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={{ before: new Date() }}
          className="mx-auto"
        />
        <div>
          <Select value={time} onValueChange={setTime}>
            <SelectTrigger className="h-11 w-full rounded-2xl">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              {(availableSlots.length === 0 ? TIME_SLOTS : availableSlots).map((slot) => {
                const booked = bookedSet.has(slot);
                return (
                  <SelectItem key={slot} value={slot}>
                    <div className="flex items-center justify-between">
                      <span>{slot}</span>
                      {booked && (
                        <span className="ml-3 text-xs text-muted-foreground/90">Doctor already has an appointment</span>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            className="rounded-2xl"
            onClick={confirm}
            disabled={!date || reschedule.isPending}
          >
            {reschedule.isPending ? "Rescheduling…" : "Confirm new date"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
            <RescheduleDialog appointment={appointment} />
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
                <RescheduleDialog appointment={appointment} />
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
