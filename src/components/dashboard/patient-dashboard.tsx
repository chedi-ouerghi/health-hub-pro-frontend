import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Building2,
  CalendarCheck,
  CalendarPlus,
  Clock,
  MapPin,
  MessageSquare,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import {
  ActivityWidget,
  AppointmentStatsChart,
  CalendarPreview,
  HealthMetrics,
  HealthTipsWidget,
  MedicationsWidget,
  QuickActions,
  RecentDoctors,
  VitalsChart,
} from "@/components/dashboard/widgets";
import { useAppointmentsQuery } from "@/hooks/api/use-appointments";
import { useDoctorsQuery } from "@/hooks/api/use-doctors";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!target) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  const diff = target ? Math.max(target.getTime() - now, 0) : 0;
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1000),
  };
}

export function PatientDashboard() {
  const userQuery = useCurrentUserQuery();
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const doctorsQuery = useDoctorsQuery({ limit: 100 });

  const loading = appointmentsQuery.isPending || doctorsQuery.isPending || userQuery.isPending;

  const user = userQuery.data;
  const patientName = user?.patient?.firstName ?? "there";
  const plan = user?.patient?.membershipPlan ?? "Standard";

  const upcoming = useMemo(() => {
    return (appointmentsQuery.data?.data ?? [])
      .filter((a) => a.status === "UPCOMING")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }, [appointmentsQuery.data]);

  const next = upcoming[0];
  const doctor =
    doctorsQuery.data?.data?.find((d) => d.id === next?.doctorId) ?? doctorsQuery.data?.data?.[0];

  const target = useMemo(() => (next ? new Date(next.scheduledAt) : null), [next]);
  const { hours, minutes, seconds } = useCountdown(target);

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-5">
        <Skeleton className="col-span-8 h-64 rounded-3xl" />
        <Skeleton className="col-span-4 h-64 rounded-3xl" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="col-span-3 h-40 rounded-3xl" />
        ))}
        <Skeleton className="col-span-8 h-80 rounded-3xl" />
        <Skeleton className="col-span-4 h-80 rounded-3xl" />
      </div>
    );
  }

  const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "your doctor";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <div className="grid grid-cols-12 gap-5">
        {/* Welcome + next consultation */}
        <motion.section
          variants={fadeUp}
          className="col-span-8 overflow-hidden rounded-3xl gradient-teal p-8 shadow-glow"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-medium text-primary-foreground">
                <Sparkles className="size-3" /> {plan}
              </span>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-primary-foreground">
                Good morning, {patientName}
              </h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-primary-foreground/80">
                {next
                  ? `Your next consultation with ${doctorName} is on the way. Notes and your appointment are ready.`
                  : `No upcoming consultations. Find a specialist and book your next visit.`}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Button
                  asChild
                  className="h-11 rounded-2xl bg-primary-foreground px-5 text-primary hover:bg-primary-foreground/90"
                >
                  <Link to="/find-doctor">
                    <CalendarPlus className="size-4" /> Book a consultation
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="h-11 rounded-2xl border-primary-foreground/30 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                >
                  <Link to="/appointments">View appointments</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-3xl bg-primary-foreground/12 p-5 text-center backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-wide text-primary-foreground/70">
                Next consultation
              </p>
              {target ? (
                <>
                  <div className="mt-3 flex items-end gap-2">
                    {[
                      { v: hours, l: "hrs" },
                      { v: minutes, l: "min" },
                      { v: seconds, l: "sec" },
                    ].map((unit) => (
                      <div
                        key={unit.l}
                        className="min-w-14 rounded-2xl bg-primary-foreground/15 py-2.5"
                      >
                        <p className="text-2xl font-semibold tabular-nums text-primary-foreground">
                          {String(unit.v).padStart(2, "0")}
                        </p>
                        <p className="text-[10px] text-primary-foreground/70">{unit.l}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-primary-foreground/80">
                    {next?.scheduledAt
                      ? new Date(next.scheduledAt).toLocaleDateString("en-US", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                        })
                      : ""}{" "}
                    ·{" "}
                    {next?.scheduledAt
                      ? new Date(next.scheduledAt).toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })
                      : ""}{" "}
                    · In-clinic
                  </p>
                </>
              ) : (
                <p className="mt-4 max-w-[180px] text-xs leading-relaxed text-primary-foreground/80">
                  Nothing scheduled yet — pick a specialist to get started.
                </p>
              )}
            </div>
          </div>
        </motion.section>

        {/* Doctor quick profile */}
        {doctor && (
          <motion.section variants={fadeUp} className="col-span-4 surface-card p-6">
            <div className="flex items-center gap-4">
              {doctor.photoUrl && (
                <img
                  src={doctor.photoUrl}
                  alt={doctorName}
                  width={512}
                  height={512}
                  className="size-16 rounded-3xl object-cover"
                />
              )}
              <div>
                <p className="text-base font-semibold">{doctorName}</p>
                <p className="text-xs text-muted-foreground">{doctor.specialty?.name ?? ""}</p>
                <p className="mt-1 flex items-center gap-1 text-xs font-medium">
                  <Star className="size-3.5 fill-warning text-warning" />
                  {Number(doctor.ratingAverage).toFixed(1)}
                  <span className="text-muted-foreground">({doctor.reviewCount} reviews)</span>
                </p>
              </div>
            </div>

            <TooltipProvider>
              <div className="mt-5 grid grid-cols-1 gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toast("Messaging is coming soon")}
                      className="rounded-2xl border border-border py-3 opacity-70 transition-all hover:border-primary/40 hover:bg-primary-soft/60"
                    >
                      <MessageSquare className="mx-auto size-4 text-primary" />
                      <span className="mt-1.5 block text-[11px] font-medium">Message</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Bientôt disponible</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 text-xs">
              <div className="flex items-start gap-2">
                <Clock className="mt-0.5 size-4 text-primary" />
                <div>
                  <dt className="font-medium">{doctor.yearsOfExperience} Years</dt>
                  <dd className="text-muted-foreground">Experience</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Users className="mt-0.5 size-4 text-primary" />
                <div>
                  <dt className="font-medium">{doctor.patientCount}+</dt>
                  <dd className="text-muted-foreground">Patients</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="mt-0.5 size-4 text-primary" />
                <div>
                  <dt className="font-medium">{Number(doctor.recommendationRate) || 0}%</dt>
                  <dd className="text-muted-foreground">Recommend</dd>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 text-primary" />
                <div>
                  <dt className="font-medium truncate">{doctor.city}</dt>
                  <dd className="text-muted-foreground">Location</dd>
                </div>
              </div>
            </dl>
          </motion.section>
        )}
      </div>

      <HealthMetrics />

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-8 space-y-5">
          <VitalsChart />
          <div className="grid grid-cols-2 gap-5">
            <AppointmentStatsChart />
            <MedicationsWidget />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <ActivityWidget />
            <div className="space-y-5">
              <CalendarPreview />
              <RecentDoctors />
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-5">
          <motion.div variants={fadeUp} className="surface-card p-6">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary-soft">
                <CalendarCheck className="size-[18px] text-primary" />
              </span>
              <div>
                <p className="text-sm font-semibold">Upcoming appointments</p>
                <p className="text-xs text-muted-foreground">{upcoming.length} scheduled</p>
              </div>
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-4 text-xs text-muted-foreground">No upcoming appointments.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcoming.map((appointment) => (
                  <li
                    key={appointment.id}
                    className="rounded-2xl border border-border p-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      {appointment.doctor?.photoUrl && (
                        <img
                          src={appointment.doctor.photoUrl}
                          alt=""
                          loading="lazy"
                          className="size-10 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {appointment.doctor
                            ? `${appointment.doctor.firstName} ${appointment.doctor.lastName}`
                            : "Doctor"}
                        </p>
                        <p className="text-xs text-muted-foreground">In-clinic visit</p>
                      </div>
                      <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold text-primary">
                        Upcoming
                      </span>
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3.5" />
                      {new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      ·{" "}
                      {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>

          <QuickActions onAction={(label) => toast.success(`${label} — request submitted`)} />
          <HealthTipsWidget />
        </div>
      </div>
    </motion.div>
  );
}

export function RoleDashboardPlaceholder({ role }: { role: string }) {
  return (
    <div className="surface-card grid place-items-center p-20 text-center">
      <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
        <Users className="size-6 text-primary" />
      </span>
      <p className="mt-5 text-base font-semibold">Welcome, {role.toLowerCase()}!</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Your dashboard is not available yet. Please sign in with a patient account to access
        appointments, vitals and health records.
      </p>
    </div>
  );
}
