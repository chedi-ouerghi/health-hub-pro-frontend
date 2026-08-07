import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Pill, Plus, Trash2, HeartPulse } from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import {
  useCreateMedicationMutation,
  useDeleteMedicationMutation,
  useMedicationsQuery,
  useUpdateMedicationMutation,
} from "@/hooks/api/use-medications";
import { useVitalsQuery } from "@/hooks/api/use-vitals";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/health-records")({
  head: () => ({
    meta: [
      { title: "Health Records — MediCare" },
      {
        name: "description",
        content: "Your medications and tracked vital signs in one place.",
      },
    ],
  }),
  component: HealthRecordsPage,
});

function HealthRecordsPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h2 className="text-2xl font-semibold tracking-tight">Health records</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Medications and vitals tracked for your care.
        </p>
      </motion.div>

      <Tabs defaultValue="medications" className="space-y-5">
        <TabsList className="rounded-2xl">
          <TabsTrigger value="medications" className="rounded-xl">
            <Pill className="size-4" /> Medications
          </TabsTrigger>
          <TabsTrigger value="vitals" className="rounded-xl">
            <HeartPulse className="size-4" /> Vitals
          </TabsTrigger>
        </TabsList>
        <TabsContent value="medications" className="space-y-5">
          <MedicationsTab />
        </TabsContent>
        <TabsContent value="vitals" className="space-y-5">
          <VitalsTab />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

function MedicationsTab() {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const medicationsQuery = useMedicationsQuery();
  const create = useCreateMedicationMutation();
  const update = useUpdateMedicationMutation();
  const remove = useDeleteMedicationMutation();

  const addMedication = () => {
    if (!name.trim() || !dose.trim()) {
      toast.error("Please fill in medication name and dose");
      return;
    }
    create.mutate(
      { name: name.trim(), dose: dose.trim(), scheduledTime },
      {
        onSuccess: () => {
          setName("");
          setDose("");
          toast.success("Medication added");
        },
        onError: (err) =>
          toast.error("Failed to add", {
            description: err instanceof Error ? err.message : "Please try again.",
          }),
      },
    );
  };

  return (
    <>
      <motion.div variants={fadeUp} className="surface-card p-7">
        <h3 className="text-base font-semibold">Add medication</h3>
        <div className="mt-5 grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="med-name" className="text-xs font-medium text-muted-foreground">
              Name
            </Label>
            <Input
              id="med-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Metformin"
              className="mt-2 h-11 rounded-2xl"
            />
          </div>
          <div>
            <Label htmlFor="med-dose" className="text-xs font-medium text-muted-foreground">
              Dose
            </Label>
            <Input
              id="med-dose"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder="e.g. 500mg"
              className="mt-2 h-11 rounded-2xl"
            />
          </div>
          <div>
            <Label htmlFor="med-time" className="text-xs font-medium text-muted-foreground">
              Scheduled time
            </Label>
            <Input
              id="med-time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="mt-2 h-11 rounded-2xl"
            />
          </div>
        </div>
        <Button onClick={addMedication} disabled={create.isPending} className="mt-5 rounded-2xl">
          <Plus className="size-4" /> {create.isPending ? "Adding…" : "Add medication"}
        </Button>
      </motion.div>

      <motion.div variants={fadeUp} className="surface-card p-7">
        <h3 className="text-base font-semibold">Current medications</h3>
        {medicationsQuery.isPending ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (medicationsQuery.data ?? []).length === 0 ? (
          <p className="mt-5 rounded-2xl bg-muted/60 p-6 text-sm text-muted-foreground">
            No medications tracked yet. Add your first medication above.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {(medicationsQuery.data ?? []).map((med) => {
              const taken = med.logs?.some((log) => log.status === "TAKEN");
              return (
                <li
                  key={med.id}
                  className="flex items-center gap-4 rounded-2xl border border-border/70 p-4"
                >
                  <span
                    className={cn(
                      "grid size-10 place-items-center rounded-2xl",
                      taken ? "bg-success/12 text-success" : "bg-primary-soft text-primary",
                    )}
                  >
                    <Pill className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{med.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {med.dose} · {med.scheduledTime}
                    </p>
                  </div>
                  <Switch
                    checked={med.isActive}
                    onCheckedChange={(v) => update.mutate({ id: med.id, payload: { isActive: v } })}
                    aria-label={`Toggle ${med.name}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl text-muted-foreground hover:text-destructive"
                    onClick={() => remove.mutate(med.id)}
                    aria-label={`Delete ${med.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </>
  );
}

function VitalsTab() {
  const vitalsQuery = useVitalsQuery(100);
  const records = [...(vitalsQuery.data ?? [])].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  return (
    <motion.div variants={fadeUp} className="surface-card p-7">
      <h3 className="text-base font-semibold">Recent vitals</h3>
      {vitalsQuery.isPending ? (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-muted/60 p-6 text-sm text-muted-foreground">
          No vital readings recorded yet.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {records.slice(0, 10).map((record) => (
            <li
              key={record.id}
              className="flex items-center justify-between rounded-2xl border border-border/70 p-4"
            >
              <div>
                <p className="text-sm font-medium">
                  {new Date(record.recordedAt).toLocaleDateString("en-US", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(record.recordedAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{record.heartRate ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">HR bpm</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">
                    {record.systolic && record.diastolic
                      ? `${record.systolic}/${record.diastolic}`
                      : "—"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">BP</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{record.sleepHours ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">Sleep h</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">{record.steps ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">Steps</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
