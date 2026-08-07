import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CalendarClock, Clock, Plus, Trash2 } from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import {
  useCreateAvailabilityMutation,
  useDeleteAvailabilityMutation,
  useDoctorAvailabilitiesQuery,
  useUpdateAvailabilityMutation,
} from "@/hooks/api/use-doctors";
import type { DayOfWeek } from "@/types/doctor.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/availabilities")({
  head: () => ({
    meta: [
      { title: "Availability — MediCare" },
      {
        name: "description",
        content: "Manage your weekly availability slots.",
      },
    ],
  }),
  component: AvailabilitiesPage,
});

const DAYS: DayOfWeek[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const DAY_LABELS: Record<DayOfWeek, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

function AvailabilitiesPage() {
  const userQuery = useCurrentUserQuery();
  const doctor = userQuery.data?.doctor;
  const role = userQuery.data?.role;

  const availabilitiesQuery = useDoctorAvailabilitiesQuery(doctor?.id ?? "");
  const createAvailability = useCreateAvailabilityMutation();
  const updateAvailability = useUpdateAvailabilityMutation();
  const deleteAvailability = useDeleteAvailabilityMutation();

  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("MONDAY");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [slotMinutes, setSlotMinutes] = useState("30");

  const handleCreate = () => {
    if (!doctor) return;
    if (startTime >= endTime) {
      toast.error("Invalid time range", { description: "Start time must be before end time." });
      return;
    }
    createAvailability.mutate(
      {
        dayOfWeek,
        startTime,
        endTime,
        slotMinutes: Number(slotMinutes) || 30,
      },
      {
        onSuccess: () => {
          toast.success("Slot added", { description: `Added ${DAY_LABELS[dayOfWeek]} slot.` });
          setStartTime("09:00");
          setEndTime("17:00");
        },
        onError: (err) => {
          toast.error("Failed to add slot", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  if (role !== "DOCTOR") {
    return (
      <div className="surface-card mx-auto max-w-lg p-8 text-center">
        <CalendarClock className="mx-auto size-10 text-primary" />
        <h2 className="mt-4 text-xl font-semibold">Availability</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Only doctors manage weekly availability slots.
        </p>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Weekly availability</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Define the recurring time slots patients can book.
          </p>
        </div>
      </motion.div>

      <motion.section variants={fadeUp} className="surface-card p-7">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Plus className="size-4 text-primary" /> Add a slot
        </h3>
        <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-5">
          <div>
            <Label className="text-xs font-medium text-muted-foreground">Day</Label>
            <Select value={dayOfWeek} onValueChange={(v) => setDayOfWeek(v as DayOfWeek)}>
              <SelectTrigger className="mt-2 h-11 w-full rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d} value={d}>
                    {DAY_LABELS[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="startTime" className="text-xs font-medium text-muted-foreground">
              Start
            </Label>
            <Input
              id="startTime"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-2 h-11 rounded-2xl"
            />
          </div>
          <div>
            <Label htmlFor="endTime" className="text-xs font-medium text-muted-foreground">
              End
            </Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-2 h-11 rounded-2xl"
            />
          </div>
          <div>
            <Label htmlFor="slotMinutes" className="text-xs font-medium text-muted-foreground">
              Slot length (min)
            </Label>
            <Input
              id="slotMinutes"
              type="number"
              min={10}
              step={5}
              value={slotMinutes}
              onChange={(e) => setSlotMinutes(e.target.value)}
              className="mt-2 h-11 rounded-2xl"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleCreate}
              disabled={createAvailability.isPending}
              className="h-11 w-full rounded-2xl"
            >
              {createAvailability.isPending ? "Adding…" : "Add slot"}
            </Button>
          </div>
        </div>
      </motion.section>

      <motion.section variants={fadeUp} className="surface-card p-7">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Clock className="size-4 text-primary" /> Current slots
        </h3>

        {availabilitiesQuery.isLoading ? (
          <div className="mt-5 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : availabilitiesQuery.data?.length ? (
          <ul className="mt-5 divide-y divide-border">
            {DAYS.map((day) => {
              const daySlots = (availabilitiesQuery.data ?? []).filter((a) => a.dayOfWeek === day);
              if (!daySlots.length) return null;
              return (
                <li key={day} className="grid grid-cols-12 items-center gap-4 py-4">
                  <span className="col-span-3 text-sm font-semibold">{DAY_LABELS[day]}</span>
                  <div className="col-span-5 space-y-2">
                    {daySlots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
                      >
                        <span className="font-mono text-xs font-medium">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-semibold text-primary">
                          {slot.slotMinutes} min
                        </span>
                        <div className="ml-auto flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={slot.isActive ?? true}
                              onCheckedChange={(v) =>
                                updateAvailability.mutate(
                                  { availId: slot.id!, payload: { isActive: v } },
                                  {
                                    onSuccess: () =>
                                      toast.success(v ? "Slot enabled" : "Slot paused"),
                                  },
                                )
                              }
                            />
                            <span className="text-xs">
                              {(slot.isActive ?? true) ? "Active" : "Paused"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-xl text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              deleteAvailability.mutate(slot.id!, {
                                onSuccess: () =>
                                  toast.success("Slot removed", {
                                    description: `${DAY_LABELS[day]} ${slot.startTime}–${slot.endTime}`,
                                  }),
                              })
                            }
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            No availability slots yet. Add your first slot above.
          </p>
        )}
      </motion.section>
    </motion.div>
  );
}
