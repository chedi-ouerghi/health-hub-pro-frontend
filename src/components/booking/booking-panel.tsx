import { useMemo, useState } from "react";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight, ShieldCheck,
  Stethoscope,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import type { Doctor } from "@/types/doctor.types";
import { useCreateAppointmentMutation } from "@/hooks/api/use-appointments";
import { cn } from "@/lib/utils";
import { stripePromise } from "@/services/payments.service";
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

// Validation functions
const validateCardHolderName = (value: string): string | null => {
  if (!value.trim()) return "Card holder name is required";
  if (value.trim().length < 3) return "Name must be at least 3 characters";
  if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return "Name can only contain letters, spaces, hyphens, and apostrophes";
  return null;
};

export function BookingPanel({ doctor }: { doctor: Doctor }) {
  return <Elements stripe={stripePromise}><BookingPanelContent doctor={doctor} /></Elements>;
}

function BookingPanelContent({ doctor }: { doctor: Doctor }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [notes, setNotes] = useState("");
  const [cardHolderName, setCardHolderName] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
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

  const validateAllFields = () => {
    const errors: Record<string, string> = {};
    const cardHolderError = validateCardHolderName(cardHolderName);
    if (cardHolderError) errors.cardHolderName = cardHolderError;

    setFormErrors(errors);
    setTouchedFields({
      cardHolderName: true,
    });

    return Object.keys(errors).length === 0;
  };


  const confirmBooking = async () => {
    if (!effectiveSlot) return;

    // Validate all fields
    if (!validateAllFields()) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    const [hh, mm] = effectiveSlot.split(":").map(Number);
    const scheduledAt = new Date(base.getFullYear(), base.getMonth(), selectedDay, hh, mm);
    const trimmedNotes = notes.trim();

    if (!stripe || !elements) {
      toast.error("Payment form is not ready");
      return;
    }
    createAppointment.mutate(
      {
        doctorId: doctor.id,
        scheduledAt: scheduledAt.toISOString(),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      },
      {
        onMutate: () => {
          setIsProcessing(true);
        },
        onSuccess: async (appointment) => {
          const card = elements.getElement(CardElement);
          if (!card || !appointment.clientSecret) {
            setIsProcessing(false);
            toast.error("Payment could not be initialized");
            return;
          }
          const result = await stripe.confirmCardPayment(appointment.clientSecret, {
            payment_method: { card, billing_details: { name: cardHolderName.trim() } },
          });
          setIsProcessing(false);
          if (result.error) {
            toast.error("Payment failed", { description: result.error.message });
            return;
          }
          setIsConfirmed(true);
          setConfirmOpen(false);
          toast.success("Payment submitted", { description: "Your appointment will be confirmed after payment verification." });
          navigate({ to: "/appointments" });
        },
        onError: (err) => {
          setIsProcessing(false);
          const message = err instanceof Error ? err.message : "Please try again.";
          toast.error("Booking failed", { description: message });
        },
      },
    );
  };

  const getFieldError = (field: string): string | undefined => {
    return touchedFields[field] ? formErrors[field] : undefined;
  };

  const isFieldValid = (field: string): boolean => {
    return touchedFields[field] && !formErrors[field];
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
          onClick={() => {
            setConfirmOpen(true);
            // Reset touched state when opening dialog
            setTouchedFields({});
            setFormErrors({});
          }}
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
          <div className="mt-4 space-y-3">
            <p className="text-sm font-medium">Payment</p>
            <div className="mb-2 flex items-center gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center rounded-full w-6 h-6 ${Object.keys(formErrors).length === 0 && Object.keys(touchedFields).length ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>1</span>
                <span>Card details</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center rounded-full w-6 h-6 ${isProcessing ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>2</span>
                <span>Processing</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center justify-center rounded-full w-6 h-6 ${isConfirmed ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>3</span>
                <span>Confirmed</span>
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <input
                  aria-label="Card holder"
                  placeholder="Card holder name"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 transition-colors",
                    getFieldError('cardHolderName')
                      ? "border-red-500 focus:border-red-500"
                      : isFieldValid('cardHolderName')
                        ? "border-green-500"
                        : "border-gray-300 focus:border-primary"
                  )}
                />
                {getFieldError('cardHolderName') && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="size-3" />
                    {getFieldError('cardHolderName')}
                  </p>
                )}
                {isFieldValid('cardHolderName') && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                    <CheckCircle2 className="size-3" />
                    Valid
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-gray-300 bg-white p-3">
                <CardElement options={{ hidePostalCode: false }} />
              </div>
              <p className="text-xs text-muted-foreground">Test mode only. Card data is handled securely by Stripe.</p>
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