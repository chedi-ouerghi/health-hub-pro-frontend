import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import type { Doctor } from "@/types/doctor.types";
import { useCreateAppointmentMutation } from "@/hooks/api/use-appointments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const JS_DAY_TO_PRISMA = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function buildSlots(startTime: string, endTime: string, slotMinutes: number): string[] {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const slots: string[] = [];
  let cur = (sh || 0) * 60 + (sm || 0);
  const endMin = (eh || 0) * 60 + (em || 0);
  while (cur < endMin) {
    const h = Math.floor(cur / 60);
    const m = cur % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    cur += slotMinutes || 30;
  }
  return slots;
}

function format12(slot: string): string {
  const [h = 0, m = 0] = slot.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
}

export function BookingPanel({ doctor }: { doctor: Doctor }) {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [notes, setNotes] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const createAppointment = useCreateAppointmentMutation();

  const name = `${doctor.firstName} ${doctor.lastName}`;
  const specialty = doctor.specialty?.name ?? "";
  const price = Number(doctor.consultationPrice) || 0;
  const currencySymbol = doctor.currency === "EUR" ? "€" : "$";

  const base = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const monthLabel = `${MONTHS[base.getMonth()]} ${base.getFullYear()}`;
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const startWeekday = (base.getDay() + 6) % 7;

  const availableDays = useMemo(
    () =>
      new Set(
        (doctor.availabilities ?? []).filter((a) => a.isActive !== false).map((a) => a.dayOfWeek),
      ),
    [doctor.availabilities],
  );

  const validSlots = useMemo(() => {
    const weekday =
      JS_DAY_TO_PRISMA[new Date(base.getFullYear(), base.getMonth(), selectedDay).getDay()]!;
    const day = new Date(base.getFullYear(), base.getMonth(), selectedDay);
    if (
      !availableDays.has(weekday) ||
      day < new Date(now.getFullYear(), now.getMonth(), now.getDate())
    ) {
      return [];
    }
    const slots = new Set<string>();
    for (const avail of doctor.availabilities ?? []) {
      if (avail.isActive === false || avail.dayOfWeek !== weekday) continue;
      for (const slot of buildSlots(avail.startTime, avail.endTime, avail.slotMinutes)) {
        const [h, m] = slot.split(":").map(Number);
        if (new Date(base.getFullYear(), base.getMonth(), selectedDay, h, m) > now) {
          slots.add(slot);
        }
      }
    }
    return [...slots].sort();
  }, [doctor.availabilities, availableDays, base, selectedDay, now]);

  const effectiveSlot = validSlots.includes(selectedSlot) ? selectedSlot : (validSlots[0] ?? "");
  const visibleSlots = showAll ? validSlots : validSlots.slice(0, 9);

  const dateLabel = useMemo(
    () =>
      new Date(base.getFullYear(), base.getMonth(), selectedDay).toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
    [base, selectedDay],
  );

  const confirmBooking = () => {
    if (!effectiveSlot) return;
    const [hh, mm] = effectiveSlot.split(":").map(Number);
    const scheduledAt = new Date(base.getFullYear(), base.getMonth(), selectedDay, hh, mm);

    const trimmedNotes = notes.trim();
    createAppointment.mutate(
      {
        doctorId: doctor.id,
        scheduledAt: scheduledAt.toISOString(),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          toast.success("Appointment confirmed", {
            description: `${name} · ${dateLabel} at ${format12(effectiveSlot)}`,
          });
          navigate({ to: "/appointments" });
        },
        onError: (err) => {
          const message = err instanceof Error ? err.message : "Please try again.";
          toast.error("Booking failed", { description: message });
        },
      },
    );
  };

  return (
    <div className="surface-card p-7">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Book Appointment</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your preferred date and time for the in-clinic visit.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3">
          <span className="grid size-9 place-items-center rounded-xl bg-primary-soft">
            <Stethoscope className="size-4 text-primary" />
          </span>
          <div>
            <p className="text-[11px] text-muted-foreground">Consultation</p>
            <p className="text-sm font-medium">
              {currencySymbol}
              {price.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 rounded-3xl border border-border p-6">
        <div>
          <p className="text-sm font-medium">Select Date</p>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-lg font-semibold tracking-tight">{monthLabel}</p>
            <div className="flex gap-2">
              <button
                aria-label="Previous month"
                onClick={() => setMonthOffset((m) => Math.max(0, m - 1))}
                className="grid size-8 place-items-center rounded-xl border border-border transition-colors hover:bg-muted"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                aria-label="Next month"
                onClick={() => setMonthOffset((m) => Math.min(11, m + 1))}
                className="grid size-8 place-items-center rounded-xl border border-border transition-colors hover:bg-muted"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <span key={d} className="py-2 font-medium text-muted-foreground">
                {d}
              </span>
            ))}
            {Array.from({ length: startWeekday }).map((_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const date = new Date(base.getFullYear(), base.getMonth(), day);
              const weekday = JS_DAY_TO_PRISMA[date.getDay()]!;
              const enabled = availableDays.has(weekday);
              const past = date < new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const active = day === selectedDay;
              const clickable = enabled && !past;
              return (
                <button
                  key={day}
                  onClick={() => clickable && setSelectedDay(day)}
                  disabled={!clickable}
                  aria-pressed={active}
                  className={cn(
                    "grid aspect-square place-items-center rounded-xl text-xs transition-all",
                    !clickable && "text-muted-foreground/35",
                    clickable && !active && "hover:bg-muted",
                    clickable && enabled && !active && "ring-1 ring-inset ring-primary/25",
                    active &&
                      clickable &&
                      "gradient-teal font-semibold text-primary-foreground shadow-glow",
                    active && !clickable && "ring-1 ring-inset ring-border",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-2 rounded-full bg-primary" /> Available
          </p>
        </div>

        <div className="border-l border-border pl-6">
          <p className="text-sm font-medium">Select Time</p>
          {validSlots.length === 0 ? (
            <p className="mt-4 rounded-2xl bg-muted/60 p-5 text-xs leading-relaxed text-muted-foreground">
              No availability on this day. Pick another date to see open slots.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {visibleSlots.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    aria-pressed={slot === effectiveSlot}
                    className={cn(
                      "rounded-xl border py-3 text-xs font-medium transition-all",
                      slot === effectiveSlot
                        ? "gradient-teal border-transparent text-primary-foreground shadow-glow"
                        : "border-border hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/60",
                    )}
                  >
                    {format12(slot)}
                  </button>
                ))}
              </div>
              {validSlots.length > 9 && (
                <button
                  onClick={() => setShowAll((s) => !s)}
                  className="mt-4 text-xs font-medium text-primary hover:underline"
                >
                  {showAll ? "Show fewer slots" : `View all ${validSlots.length} slots`}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-5">
        <div>
          <p className="text-sm font-medium">
            Notes <span className="text-muted-foreground">(Optional)</span>
          </p>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any symptoms or notes for the doctor…"
            className="mt-3 h-24 resize-none rounded-2xl"
          />
        </div>

        <div className="rounded-2xl border border-border p-5">
          <p className="text-sm font-medium">Appointment Summary</p>
          <dl className="mt-4 space-y-2.5 text-xs">
            {[
              ["Doctor", name],
              ["Specialization", specialty],
              ["Date", dateLabel],
              ["Time", effectiveSlot ? format12(effectiveSlot) : "—"],
              ["Duration", "30 mins"],
              ["Type", "In-clinic visit"],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium">Total</span>
            <span className="text-xl font-semibold text-primary">
              {currencySymbol}
              {price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <motion.div whileHover={{ scale: 1.005 }} className="mt-6">
        <Button
          onClick={() => setConfirmOpen(true)}
          disabled={!effectiveSlot || createAppointment.isPending}
          className="h-14 w-full rounded-2xl gradient-teal text-base font-semibold shadow-glow"
        >
          {effectiveSlot
            ? `Book Appointment · ${currencySymbol}${price.toFixed(2)}`
            : "No available slots"}
        </Button>
      </motion.div>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5" /> Your payment is secure and encrypted
      </p>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm your appointment</DialogTitle>
            <DialogDescription>
              {name} · {dateLabel} at {effectiveSlot ? format12(effectiveSlot) : "—"} · In-clinic
              visit
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-2xl bg-muted/60 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Consultation fee</span>
              <span className="font-medium">
                {currencySymbol}
                {price.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex justify-between">
              <span className="text-muted-foreground">Platform fee</span>
              <span className="font-medium">{currencySymbol}0.00</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-2xl" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              className="rounded-2xl"
              onClick={confirmBooking}
              disabled={createAppointment.isPending}
            >
              {createAppointment.isPending ? "Confirming…" : "Confirm booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
