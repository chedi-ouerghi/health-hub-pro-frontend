import { motion } from "motion/react";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  Check,
  CreditCard,
  FileText,
  Footprints,
  Heart,
  Lightbulb,
  MessageSquare,
  Moon,
  Pill,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnimatedCounter } from "@/components/common/animated-counter";
import { fadeUp } from "@/components/layout/app-shell";
import { useActivityLogsQuery } from "@/hooks/api/use-activity-logs";
import { useAppointmentsQuery } from "@/hooks/api/use-appointments";
import { useDoctorsQuery } from "@/hooks/api/use-doctors";
import { useMedicationsQuery } from "@/hooks/api/use-medications";
import { useVitalsQuery } from "@/hooks/api/use-vitals";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const metricIcons = { heart: Heart, activity: Activity, moon: Moon, footprints: Footprints };
const activityIcons = {
  file: FileText,
  pill: Pill,
  check: Check,
  card: CreditCard,
  message: MessageSquare,
};

const activityKindByType: Record<string, string> = {
  FILE: "file",
  PRESCRIPTION: "pill",
  APPOINTMENT: "check",
  INVOICE: "card",
  MESSAGE: "message",
};

const healthTips = [
  {
    title: "Hydration lowers migraine frequency",
    body: "Aim for 2.2L of water daily. Patients with consistent hydration report 23% fewer migraine days.",
    tag: "Neurology",
  },
  {
    title: "Move every 45 minutes",
    body: "A two-minute walk each hour improves circulation and reduces resting heart rate over time.",
    tag: "Cardiology",
  },
  {
    title: "Protect your sleep window",
    body: "Going to bed within the same 30-minute window stabilises recovery and cognitive performance.",
    tag: "Wellbeing",
  },
];

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: { label: string; to?: string; onClick?: () => void };
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {action &&
        (action.to ? (
          <Link
            to={action.to}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {action.label} <ArrowUpRight className="size-3.5" />
          </Link>
        ) : (
          <button
            onClick={action.onClick}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {action.label} <ArrowUpRight className="size-3.5" />
          </button>
        ))}
    </div>
  );
}

function percentDelta(cur: number | null | undefined, last: number | null | undefined): number {
  if (cur == null || last == null || last === 0) return 0;
  return ((cur - last) / last) * 100;
}

export function HealthMetrics() {
  const vitalsQuery = useVitalsQuery();
  const records = vitalsQuery.data ?? [];
  const latest = records[0];
  const prev = records[1];

  const metrics = [
    {
      label: "Heart Rate",
      value: latest?.heartRate ?? null,
      unit: "bpm",
      delta: percentDelta(latest?.heartRate, prev?.heartRate),
      status: "Latest reading",
      icon: "heart" as const,
    },
    {
      label: "Blood Pressure",
      value: latest?.systolic ?? null,
      unit: latest?.diastolic ? `/ ${latest.diastolic}` : "",
      delta: percentDelta(latest?.systolic, prev?.systolic),
      status: "Systolic / diastolic",
      icon: "activity" as const,
    },
    {
      label: "Sleep",
      value: latest?.sleepHours ?? null,
      unit: "hrs",
      delta: percentDelta(latest?.sleepHours, prev?.sleepHours),
      status: "Latest night",
      icon: "moon" as const,
    },
    {
      label: "Steps",
      value: latest?.steps ?? null,
      unit: "steps",
      delta: percentDelta(latest?.steps, prev?.steps),
      status: "Latest day",
      icon: "footprints" as const,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5">
      {metrics.map((metric) => {
        const Icon = metricIcons[metric.icon as keyof typeof metricIcons] ?? Activity;
        const up = metric.delta >= 0;
        return (
          <motion.div
            key={metric.label}
            variants={fadeUp}
            whileHover={{ y: -4 }}
            className="surface-card p-5"
          >
            <div className="flex items-start justify-between">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary-soft">
                <Icon className="size-[18px] text-primary" />
              </div>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                  metric.delta === 0
                    ? "bg-muted text-muted-foreground"
                    : up
                      ? "bg-success/12 text-success"
                      : "bg-destructive/10 text-destructive",
                )}
              >
                {metric.delta !== 0 &&
                  (up ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />)}
                {metric.delta !== 0 ? `${Math.abs(metric.delta).toFixed(1)}%` : "—"}
              </span>
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {metric.value == null ? (
                "—"
              ) : (
                <AnimatedCounter
                  value={metric.value}
                  decimals={Number.isInteger(metric.value) ? 0 : 1}
                />
              )}
              {metric.value != null && (
                <span className="ml-1 text-sm font-medium text-muted-foreground">
                  {metric.unit}
                </span>
              )}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{metric.status}</p>
          </motion.div>
        );
      })}
    </div>
  );
}

const chartTooltip = {
  contentStyle: {
    borderRadius: 14,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    fontSize: 12,
    boxShadow: "var(--shadow-soft)",
  },
};

export function VitalsChart() {
  const vitalsQuery = useVitalsQuery();
  const records = [...(vitalsQuery.data ?? [])].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime(),
  );
  const trend = records.slice(-6).map((r) => ({
    month: new Date(r.recordedAt).toLocaleDateString("en-US", { month: "short" }),
    heartRate: r.heartRate,
    systolic: r.systolic,
  }));

  return (
    <motion.div variants={fadeUp} className="surface-card p-6">
      <SectionTitle title="Vitals trend" />
      <p className="-mt-3 mb-4 text-xs text-muted-foreground">
        Resting heart rate and systolic pressure over the last readings
      </p>
      {trend.length < 2 ? (
        <p className="grid h-56 place-items-center text-sm text-muted-foreground">
          Not enough vitals recorded yet.
        </p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ left: -18, right: 6, top: 6 }}>
              <defs>
                <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="sys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                stroke="var(--muted-foreground)"
              />
              <Tooltip {...chartTooltip} />
              <Area
                type="monotone"
                dataKey="systolic"
                stroke="var(--chart-2)"
                fill="url(#sys)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="heartRate"
                stroke="var(--chart-1)"
                fill="url(#hr)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

function buildMonthBuckets() {
  const now = new Date();
  const buckets: { month: string; clinic: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      month: d.toLocaleDateString("en-US", { month: "short" }),
      clinic: 0,
    });
  }
  return buckets;
}

export function AppointmentStatsChart() {
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const data = buildMonthBuckets();

  for (const appointment of appointmentsQuery.data?.data ?? []) {
    const d = new Date(appointment.scheduledAt);
    const bucket = data.find(
      (b) =>
        b.month === d.toLocaleDateString("en-US", { month: "short" }) &&
        d.getFullYear() === new Date().getFullYear(),
    );
    if (bucket) bucket.clinic += 1;
  }

  return (
    <motion.div variants={fadeUp} className="surface-card p-6">
      <SectionTitle title="Appointment statistics" />
      <p className="-mt-3 mb-4 text-xs text-muted-foreground">In-clinic consultations</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -22, right: 6, top: 6 }} barGap={6}>
            <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="var(--muted-foreground)"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              fontSize={11}
              stroke="var(--muted-foreground)"
            />
            <Tooltip {...chartTooltip} cursor={{ fill: "var(--muted)", radius: 8 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            <Bar
              dataKey="clinic"
              name="In-clinic"
              fill="var(--chart-1)"
              radius={[6, 6, 0, 0]}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export function MedicationsWidget() {
  const medicationsQuery = useMedicationsQuery();
  const medications = medicationsQuery.data ?? [];

  return (
    <motion.div variants={fadeUp} className="surface-card p-6">
      <SectionTitle title="Upcoming medications" />
      {medications.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No medications tracked.</p>
      ) : (
        <ul className="space-y-2.5">
          {medications.map((med) => {
            const taken = med.logs?.some((log) => log.status === "TAKEN");
            return (
              <li
                key={med.id}
                className="flex items-center gap-3 rounded-2xl border border-border/70 px-4 py-3 transition-colors hover:bg-muted/60"
              >
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-xl",
                    taken ? "bg-success/12 text-success" : "bg-primary-soft text-primary",
                  )}
                >
                  {taken ? <Check className="size-4" /> : <Pill className="size-4" />}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium">{med.name}</span>
                  <span className="block text-xs text-muted-foreground">{med.dose}</span>
                </span>
                <span className="text-xs font-medium tabular-nums text-muted-foreground">
                  {med.scheduledTime}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function ActivityWidget() {
  const activityQuery = useActivityLogsQuery();
  const items = activityQuery.data?.logs ?? [];

  return (
    <motion.div variants={fadeUp} className="surface-card p-6">
      <SectionTitle title="Recent activity" />
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>
      ) : (
        <ol className="relative space-y-5 pl-6">
          <span className="absolute left-[13px] top-2 bottom-2 w-px bg-border" aria-hidden />
          {items.map((item) => {
            const kind = activityKindByType[item.type] ?? "file";
            const Icon = activityIcons[kind as keyof typeof activityIcons] ?? FileText;
            return (
              <li key={item.id} className="relative">
                <span className="absolute -left-6 grid size-7 place-items-center rounded-full border border-border bg-card">
                  <Icon className="size-3.5 text-primary" />
                </span>
                <p className="text-sm font-medium leading-snug">{item.title}</p>
                {item.meta && <p className="mt-0.5 text-xs text-muted-foreground">{item.meta}</p>}
                <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                  {timeAgo(item.createdAt)}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </motion.div>
  );
}

export function HealthTipsWidget() {
  return (
    <motion.div variants={fadeUp} className="surface-card overflow-hidden">
      <div className="gradient-teal p-6">
        <Lightbulb className="size-6 text-primary-foreground" />
        <p className="mt-3 text-base font-semibold text-primary-foreground">Health tips for you</p>
        <p className="mt-1 text-xs leading-relaxed text-primary-foreground/80">
          Personalised from your recent consultations
        </p>
      </div>
      <ul className="divide-y divide-border">
        {healthTips.map((tip) => (
          <li key={tip.title} className="p-5 transition-colors hover:bg-muted/50">
            <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
              {tip.tag}
            </span>
            <p className="mt-2 text-sm font-medium leading-snug">{tip.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{tip.body}</p>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export function RecentDoctors() {
  const doctorsQuery = useDoctorsQuery({ limit: 4 });

  return (
    <motion.div variants={fadeUp} className="surface-card p-6">
      <SectionTitle title="Recent doctors" action={{ label: "Find more", to: "/find-doctor" }} />
      {doctorsQuery.isPending ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ul className="space-y-2.5">
          {(doctorsQuery.data?.data ?? []).map((doctor) => (
            <li key={doctor.id}>
              <Link
                to="/find-doctor/$doctorId"
                params={{ doctorId: doctor.id }}
                className="flex items-center gap-3 rounded-2xl border border-transparent p-2.5 transition-all hover:border-border hover:bg-muted/60"
              >
                {doctor.photoUrl && (
                  <img
                    src={doctor.photoUrl}
                    alt=""
                    loading="lazy"
                    width={512}
                    height={512}
                    className="size-11 rounded-2xl object-cover"
                  />
                )}
                <span className="flex-1">
                  <span className="block text-sm font-medium">
                    {doctor.firstName} {doctor.lastName}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {doctor.specialty?.name ?? ""}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs font-medium">
                  <Star className="size-3.5 fill-warning text-warning" />
                  {Number(doctor.ratingAverage).toFixed(1)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}

export function CalendarPreview() {
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const now = new Date();
  const monthLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const highlighted = new Set<number>();
  for (const appointment of appointmentsQuery.data?.data ?? []) {
    const d = new Date(appointment.scheduledAt);
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
      highlighted.add(d.getDate());
    }
  }

  const days = Array.from({ length: 35 }, (_, i) => i - 5);
  return (
    <motion.div variants={fadeUp} className="surface-card p-6">
      <SectionTitle title={monthLabel} action={{ label: "History", to: "/history" }} />
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <span key={d} className="py-1 font-medium">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const valid = day >= 1 && day <= 31;
          const active = valid && highlighted.has(day);
          return (
            <span
              key={day}
              className={cn(
                "grid aspect-square place-items-center rounded-xl text-xs transition-colors",
                !valid && "text-muted-foreground/35",
                valid && !active && "text-foreground hover:bg-muted",
                active && "gradient-teal font-semibold text-primary-foreground",
              )}
            >
              {valid ? day : day <= 0 ? 26 + day + 5 : day - 31}
            </span>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="size-2 rounded-full gradient-teal" /> Scheduled appointment
      </div>
    </motion.div>
  );
}

export function QuickActions({ onAction }: { onAction: (label: string) => void }) {
  const actions = [
    { label: "Book appointment", icon: CalendarDays, to: "/find-doctor" },
    { label: "Message a doctor", icon: MessageSquare },
    { label: "Request refill", icon: Pill },
    { label: "Download records", icon: FileText },
  ];
  return (
    <motion.div variants={fadeUp} className="surface-card p-6">
      <SectionTitle title="Quick actions" />
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          const content = (
            <>
              <Icon className="size-[18px] text-primary" />
              <span className="mt-2.5 block text-xs font-medium leading-snug">{action.label}</span>
            </>
          );
          return action.to ? (
            <Link
              key={action.label}
              to={action.to}
              className="rounded-2xl border border-border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/50"
            >
              {content}
            </Link>
          ) : (
            <button
              key={action.label}
              onClick={() => onAction(action.label)}
              className="rounded-2xl border border-border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/50"
            >
              {content}
            </button>
          );
        })}
      </div>
      <Button asChild className="mt-4 h-11 w-full rounded-2xl">
        <Link to="/find-doctor">Find a specialist</Link>
      </Button>
    </motion.div>
  );
}
