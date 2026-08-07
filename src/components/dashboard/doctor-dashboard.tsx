import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Award,
  Building2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageSquareQuote,
  ShieldAlert,
  Star,
  Stethoscope,
  Users,
  XCircle,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import {
  useAppointmentsQuery,
  useUpdateAppointmentStatusMutation,
} from "@/hooks/api/use-appointments";
import { useInvoicesQuery } from "@/hooks/api/use-invoices";
import { useDoctorAvailabilitiesQuery, useDoctorReviewsQuery } from "@/hooks/api/use-doctors";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function isToday(date: Date) {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function DoctorDashboard() {
  const userQuery = useCurrentUserQuery();
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const invoicesQuery = useInvoicesQuery({ limit: 100 });
  const updateStatus = useUpdateAppointmentStatusMutation();
  const [busy, setBusy] = useState<string | null>(null);

  const user = userQuery.data;
  const doctor = user?.doctor;
  const doctorId = doctor?.id ?? "";
  const reviewsQuery = useDoctorReviewsQuery(doctorId, { limit: 5 });
  const availabilitiesQuery = useDoctorAvailabilitiesQuery(doctorId);

  const loading =
    appointmentsQuery.isPending ||
    invoicesQuery.isPending ||
    userQuery.isPending ||
    (Boolean(doctorId) && (reviewsQuery.isPending || availabilitiesQuery.isPending));

  const currency = invoicesQuery.data?.data?.[0]?.currency ?? "EUR";
  const money = (value: number) => `${currency === "EUR" ? "€" : "$"}${value.toFixed(2)}`;

  const today = useMemo(() => {
    return (appointmentsQuery.data?.data ?? [])
      .filter((a) => isToday(new Date(a.scheduledAt)))
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [appointmentsQuery.data]);

  const upcoming = useMemo(() => {
    return (appointmentsQuery.data?.data ?? [])
      .filter((a) => a.status === "UPCOMING")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [appointmentsQuery.data]);

  const completedCount = useMemo(
    () => (appointmentsQuery.data?.data ?? []).filter((a) => a.status === "COMPLETED").length,
    [appointmentsQuery.data],
  );

  const uniquePatientsThisMonth = useMemo(() => {
    const now = new Date();
    const patients = new Set(
      (appointmentsQuery.data?.data ?? [])
        .filter((a) => {
          const d = new Date(a.scheduledAt);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .map((a) => a.patient?.id)
        .filter(Boolean),
    );
    return patients.size;
  }, [appointmentsQuery.data]);

  const earned = useMemo(
    () =>
      (invoicesQuery.data?.data ?? [])
        .filter((i) => i.status === "PAID")
        .reduce((sum, i) => sum + Number(i.amount), 0),
    [invoicesQuery.data],
  );

  const outstanding = useMemo(
    () =>
      (invoicesQuery.data?.data ?? [])
        .filter((i) => i.status === "PENDING")
        .reduce((sum, i) => sum + Number(i.amount), 0),
    [invoicesQuery.data],
  );

  const pendingInvoices = useMemo(
    () => (invoicesQuery.data?.data ?? []).filter((i) => i.status === "PENDING").length,
    [invoicesQuery.data],
  );

  const activeSlots = useMemo(
    () => (availabilitiesQuery.data ?? []).filter((a) => a.isActive !== false).length,
    [availabilitiesQuery.data],
  );

  const activeDays = useMemo(
    () =>
      new Set(
        (availabilitiesQuery.data ?? [])
          .filter((a) => a.isActive !== false)
          .map((a) => a.dayOfWeek),
      ).size,
    [availabilitiesQuery.data],
  );

  const reviews = reviewsQuery.data?.data ?? [];

  const run = (id: string, status: "COMPLETED" | "NO_SHOW") => {
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

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-5">
        <Skeleton className="col-span-8 h-64 rounded-3xl" />
        <Skeleton className="col-span-4 h-64 rounded-3xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="col-span-3 h-40 rounded-3xl" />
        ))}
        <Skeleton className="col-span-8 h-80 rounded-3xl" />
        <Skeleton className="col-span-4 h-80 rounded-3xl" />
        <Skeleton className="col-span-12 h-72 rounded-3xl" />
      </div>
    );
  }

  const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "there";
  const isVerified = doctor?.isLicenseVerified;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {!isVerified && (
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 rounded-3xl border border-warning/40 bg-warning/10 p-4 text-sm"
        >
          <ShieldAlert className="size-5 shrink-0 text-warning" />
          <p className="text-warning-foreground">
            Your medical license is pending verification. You&apos;ll see a confirmation once our
            team validates it.
          </p>
        </motion.div>
      )}

      <div className="grid grid-cols-12 gap-5">
        <motion.section
          variants={fadeUp}
          className="col-span-8 overflow-hidden rounded-3xl gradient-teal p-8 shadow-glow"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium text-primary-foreground">
            <Stethoscope className="size-3" /> Doctor dashboard
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-primary-foreground">
            Good morning, Dr. {doctorName}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/80">
            {today.length > 0
              ? `You have ${today.length} consultation${today.length > 1 ? "s" : ""} scheduled today.`
              : `No consultations scheduled for today. Manage your availability to attract new patients.`}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <Button
              asChild
              className="h-11 rounded-2xl bg-primary-foreground px-5 text-primary hover:bg-primary-foreground/90"
            >
              <Link to="/appointments">
                <CalendarCheck className="size-4" /> View today&apos;s appointments
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              className="h-11 rounded-2xl border-primary-foreground/30 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/availabilities">Manage availability</Link>
            </Button>
          </div>
        </motion.section>

        <motion.section
          variants={fadeUp}
          className="col-span-4 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Today&apos;s schedule
          </p>
          {today.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {today.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Clock className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "Patient"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.scheduledAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Nothing scheduled today. Enjoy the calm.
            </p>
          )}
        </motion.section>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {[
          {
            label: "Patients this month",
            value: String(uniquePatientsThisMonth),
            icon: Users,
            to: "/appointments",
          },
          {
            label: "Completed consultations",
            value: String(completedCount),
            icon: CalendarDays,
            to: "/appointments",
          },
          {
            label: "Upcoming",
            value: String(upcoming.length),
            icon: CalendarCheck,
            to: "/appointments",
          },
          {
            label: "Average rating",
            value: Number(doctor?.ratingAverage ?? 0).toFixed(1),
            icon: Star,
            to: "/reviews",
          },
          {
            label: "Collected",
            value: money(earned),
            icon: CreditCard,
            to: "/billing",
          },
          {
            label: "Outstanding",
            value: money(outstanding),
            icon: Clock,
            to: "/billing",
          },
          {
            label: "Pending invoices",
            value: String(pendingInvoices),
            icon: Award,
            to: "/billing",
          },
          {
            label: "Consultation price",
            value: `${doctor?.currency === "EUR" ? "€" : "$"}${Number(doctor?.consultationPrice ?? 0).toFixed(2)}`,
            icon: Stethoscope,
            to: "/settings",
          },
        ].map((stat) => (
          <motion.div key={stat.label} variants={fadeUp} className="col-span-3">
            <Link
              to={stat.to as "/appointments" | "/reviews" | "/billing" | "/settings"}
              className="block h-full rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-sidebar-accent/40"
            >
              <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                <stat.icon className="size-5" />
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <motion.section
          variants={fadeUp}
          className="col-span-8 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">Upcoming appointments</h3>
              <p className="text-sm text-muted-foreground">
                Mark consultations as completed or no-show.
              </p>
            </div>
            <Button asChild variant="outline" className="h-9 rounded-2xl">
              <Link to="/appointments">Manage</Link>
            </Button>
          </div>
          {upcoming.length > 0 ? (
            <ul className="mt-5 divide-y divide-border">
              {upcoming.slice(0, 5).map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                    <Users className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : "Patient"}
                    </p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {a.clinicAddressSnapshot}
                    </p>
                  </div>
                  <span className="hidden text-sm text-muted-foreground sm:block">
                    {new Date(a.scheduledAt).toLocaleString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-success"
                            disabled={busy === a.id}
                            onClick={() => run(a.id, "COMPLETED")}
                          >
                            <CheckCircle2 className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark as completed</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 text-destructive"
                            disabled={busy === a.id}
                            onClick={() => run(a.id, "NO_SHOW")}
                          >
                            <XCircle className="size-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Mark as no-show</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">No upcoming appointments.</p>
          )}
        </motion.section>

        <motion.section
          variants={fadeUp}
          className="col-span-4 rounded-3xl border border-border bg-card p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold tracking-tight">Clinic</h3>
          {doctor && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{doctor.clinicName}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {doctor.city}, {doctor.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
                <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <CalendarDays className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {activeDays} day{activeDays === 1 ? "" : "s"} · {activeSlots} slot
                    {activeSlots === 1 ? "" : "s"} / week
                  </p>
                  <p className="text-xs text-muted-foreground">Your weekly availability</p>
                </div>
              </div>
              <p className="rounded-2xl bg-muted/60 p-4 text-xs leading-relaxed text-muted-foreground">
                {doctor.bio || "No biography provided."}
              </p>
            </div>
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
              <MessageSquareQuote className="size-4 text-primary" /> Recent patient reviews
            </h3>
            <p className="text-sm text-muted-foreground">Latest feedback on your consultations.</p>
          </div>
          <Button asChild variant="outline" className="h-9 rounded-2xl">
            <Link to="/reviews">All reviews</Link>
          </Button>
        </div>
        {reviews.length > 0 ? (
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {reviews.slice(0, 4).map((review) => {
              const patientName = review.patient
                ? `${review.patient.firstName} ${review.patient.lastName}`
                : "Patient";
              return (
                <li key={review.id} className="rounded-2xl bg-muted/50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-medium">{patientName}</p>
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5",
                            i < review.rating ? "fill-warning text-warning" : "text-border",
                          )}
                        />
                      ))}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            No reviews yet — they appear once your patients rate completed consultations.
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}
