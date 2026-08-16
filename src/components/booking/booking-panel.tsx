import { useMemo, useState } from "react";
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
const validateCardNumber = (value: string): string | null => {
  const cleanNumber = value.replace(/[\s-]/g, "");
  if (!cleanNumber) return "Card number is required";
  if (!/^\d+$/.test(cleanNumber)) return "Card number must contain only digits";
  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return "Card number must be between 13 and 19 digits";
  }
  return null;
};

const validateExpiryMonth = (value: string): string | null => {
  if (!value) return "Month is required";
  const month = Number(value);
  if (isNaN(month) || month < 1 || month > 12) return "Month must be between 01 and 12";
  return null;
};

const validateExpiryYear = (value: string): string | null => {
  if (!value) return "Year is required";
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  if (isNaN(year) || year < currentYear) return "Year cannot be in the past";
  if (year > currentYear + 20) return "Year is too far in the future";
  return null;
};

const validateExpiryDate = (month: string, year: string): string | null => {
  const monthError = validateExpiryMonth(month);
  const yearError = validateExpiryYear(year);
  if (monthError || yearError) return monthError || yearError;

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const expMonth = Number(month);
  const expYear = Number(year);

  if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
    return "Card has expired";
  }
  return null;
};

const validateCVC = (value: string): string | null => {
  if (!value) return "CVC is required";
  if (!/^\d+$/.test(value)) return "CVC must contain only digits";
  if (value.length < 3 || value.length > 4) return "CVC must be 3 or 4 digits";
  return null;
};

const validateCardHolderName = (value: string): string | null => {
  if (!value.trim()) return "Card holder name is required";
  if (value.trim().length < 3) return "Name must be at least 3 characters";
  if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return "Name can only contain letters, spaces, hyphens, and apostrophes";
  return null;
};

export function BookingPanel({ doctor }: { doctor: Doctor }) {
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [monthOffset, setMonthOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [selectedSlot, setSelectedSlot] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [notes, setNotes] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
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

  // Live validation for each field
  const validateField = (field: string, value: string): string | null => {
    switch (field) {
      case 'cardNumber':
        return validateCardNumber(value);
      case 'expMonth':
        return validateExpiryMonth(value);
      case 'expYear':
        return validateExpiryYear(value);
      case 'cvc':
        return validateCVC(value);
      case 'cardHolderName':
        return validateCardHolderName(value);
      default:
        return null;
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    // Update the field value
    switch (field) {
      case 'cardNumber':
        // Format card number with spaces every 4 digits
        const formatted = value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
        setCardNumber(formatted.slice(0, 19)); // Limit to 19 chars (16 digits + 3 spaces)
        break;
      case 'expMonth':
        // Only allow 2 digits
        const monthValue = value.replace(/\D/g, '').slice(0, 2);
        setExpMonth(monthValue);
        break;
      case 'expYear':
        // Only allow 4 digits
        const yearValue = value.replace(/\D/g, '').slice(0, 4);
        setExpYear(yearValue);
        break;
      case 'cvc':
        // Only allow 3-4 digits
        const cvcValue = value.replace(/\D/g, '').slice(0, 4);
        setCvc(cvcValue);
        break;
      case 'cardHolderName':
        setCardHolderName(value);
        break;
    }

    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [field]: true }));
  };

  // Validate all fields and update errors
  const validateAllFields = () => {
    const errors: Record<string, string> = {};

    const cardNumberError = validateCardNumber(cardNumber);
    if (cardNumberError) errors.cardNumber = cardNumberError;

    const cardHolderError = validateCardHolderName(cardHolderName);
    if (cardHolderError) errors.cardHolderName = cardHolderError;

    const expiryDateError = validateExpiryDate(expMonth, expYear);
    if (expiryDateError) {
      if (validateExpiryMonth(expMonth)) errors.expMonth = validateExpiryMonth(expMonth)!;
      if (validateExpiryYear(expYear)) errors.expYear = validateExpiryYear(expYear)!;
      if (!errors.expMonth && !errors.expYear) {
        errors.expMonth = expiryDateError;
      }
    }

    const cvcError = validateCVC(cvc);
    if (cvcError) errors.cvc = cvcError;

    setFormErrors(errors);
    setTouchedFields({
      cardNumber: true,
      cardHolderName: true,
      expMonth: true,
      expYear: true,
      cvc: true,
    });

    return Object.keys(errors).length === 0;
  };

  // Validate on blur
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));

    let value = '';
    switch (field) {
      case 'cardNumber': value = cardNumber; break;
      case 'expMonth': value = expMonth; break;
      case 'expYear': value = expYear; break;
      case 'cvc': value = cvc; break;
      case 'cardHolderName': value = cardHolderName; break;
    }

    const error = validateField(field, value);
    setFormErrors(prev => ({
      ...prev,
      [field]: error || '',
    }));
  };

  // Update validation on each change
  const updateValidation = (field: string, value: string) => {
    if (touchedFields[field]) {
      const error = validateField(field, value);
      setFormErrors(prev => ({
        ...prev,
        [field]: error || '',
      }));
    }
  };

  // Wrapper for onChange to also update validation
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = rawValue.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
    const limited = formatted.slice(0, 19);
    setCardNumber(limited);
    updateValidation('cardNumber', limited);
    setTouchedFields(prev => ({ ...prev, cardNumber: true }));
  };

  const handleExpMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2);
    setExpMonth(value);
    updateValidation('expMonth', value);
    setTouchedFields(prev => ({ ...prev, expMonth: true }));
  };

  const handleExpYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setExpYear(value);
    updateValidation('expYear', value);
    setTouchedFields(prev => ({ ...prev, expYear: true }));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvc(value);
    updateValidation('cvc', value);
    setTouchedFields(prev => ({ ...prev, cvc: true }));
  };

  const handleCardHolderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCardHolderName(value);
    updateValidation('cardHolderName', value);
    setTouchedFields(prev => ({ ...prev, cardHolderName: true }));
  };

  const confirmBooking = () => {
    if (!effectiveSlot) return;

    // Validate all fields
    if (!validateAllFields()) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    const [hh, mm] = effectiveSlot.split(":").map(Number);
    const scheduledAt = new Date(base.getFullYear(), base.getMonth(), selectedDay, hh, mm);
    const trimmedNotes = notes.trim();

    createAppointment.mutate(
      {
        doctorId: doctor.id,
        scheduledAt: scheduledAt.toISOString(),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        cardNumber: cardNumber.replace(/\s/g, ''), // Remove spaces before sending
        expMonth: Number(expMonth),
        expYear: Number(expYear),
        cvc,
        ...(cardHolderName ? { cardHolderName: cardHolderName.trim() } : {}),
      },
      {
        onMutate: () => {
          setIsProcessing(true);
        },
        onSuccess: () => {
          setIsProcessing(false);
          setIsConfirmed(true);
          setConfirmOpen(false);
          toast.success("Appointment confirmed", {
            description: `${name} · ${dateLabel} at ${format12(effectiveSlot)}`,
          });
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
                  onChange={handleCardHolderChange}
                  onBlur={() => handleFieldBlur('cardHolderName')}
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

              <div>
                <input
                  aria-label="Card number"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  onBlur={() => handleFieldBlur('cardNumber')}
                  maxLength={19}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2 transition-colors font-mono",
                    getFieldError('cardNumber')
                      ? "border-red-500 focus:border-red-500"
                      : isFieldValid('cardNumber')
                        ? "border-green-500"
                        : "border-gray-300 focus:border-primary"
                  )}
                />
                {getFieldError('cardNumber') && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="size-3" />
                    {getFieldError('cardNumber')}
                  </p>
                )}
                {isFieldValid('cardNumber') && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-green-500">
                    <CheckCircle2 className="size-3" />
                    Valid card number
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <input
                    aria-label="Exp month"
                    placeholder="MM"
                    value={expMonth}
                    onChange={handleExpMonthChange}
                    onBlur={() => handleFieldBlur('expMonth')}
                    maxLength={2}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 transition-colors",
                      getFieldError('expMonth') || (touchedFields['expMonth'] && touchedFields['expYear'] && !formErrors['expMonth'] && formErrors['expYear'] && validateExpiryDate(expMonth, expYear))
                        ? "border-red-500 focus:border-red-500"
                        : isFieldValid('expMonth')
                          ? "border-green-500"
                          : "border-gray-300 focus:border-primary"
                    )}
                  />
                  {(getFieldError('expMonth') || (touchedFields['expMonth'] && touchedFields['expYear'] && !formErrors['expMonth'] && formErrors['expYear'] && validateExpiryDate(expMonth, expYear))) && (
                    <p className="mt-1 text-xs text-red-500">
                      {getFieldError('expMonth') || validateExpiryDate(expMonth, expYear)}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    aria-label="Exp year"
                    placeholder="YYYY"
                    value={expYear}
                    onChange={handleExpYearChange}
                    onBlur={() => handleFieldBlur('expYear')}
                    maxLength={4}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 transition-colors",
                      getFieldError('expYear') || (touchedFields['expMonth'] && touchedFields['expYear'] && !formErrors['expMonth'] && formErrors['expYear'] && validateExpiryDate(expMonth, expYear))
                        ? "border-red-500 focus:border-red-500"
                        : isFieldValid('expYear')
                          ? "border-green-500"
                          : "border-gray-300 focus:border-primary"
                    )}
                  />
                  {getFieldError('expYear') && (
                    <p className="mt-1 text-xs text-red-500">
                      {getFieldError('expYear')}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    aria-label="CVC"
                    placeholder="CVC"
                    value={cvc}
                    onChange={handleCvcChange}
                    onBlur={() => handleFieldBlur('cvc')}
                    maxLength={4}
                    type="password"
                    className={cn(
                      "w-full rounded-xl border px-3 py-2 transition-colors",
                      getFieldError('cvc')
                        ? "border-red-500 focus:border-red-500"
                        : isFieldValid('cvc')
                          ? "border-green-500"
                          : "border-gray-300 focus:border-primary"
                    )}
                  />
                  {getFieldError('cvc') && (
                    <p className="mt-1 text-xs text-red-500">
                      {getFieldError('cvc')}
                    </p>
                  )}
                  {isFieldValid('cvc') && (
                    <p className="mt-1 text-xs text-green-500">
                      ✓
                    </p>
                  )}
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                This is a simulated payment for demo purposes.
              </p>
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