import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  CalendarDays,
  Droplets,
  HeartPulse,
  Mail,
  Phone,
  Pill,
  Plus,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { usePatientQuery } from "@/hooks/api/use-patients";
import {
  useCreatePatientMedicationMutation,
  useCreatePatientVitalMutation,
  usePatientMedicationsQuery,
  usePatientVitalsQuery,
} from "@/hooks/api/use-patients";
import { useAppointmentsQuery } from "@/hooks/api/use-appointments";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  head: () => ({
    meta: [
      { title: "Patient file — MediCare" },
      {
        name: "description",
        content: "Doctor-side patient file: medications, vitals and appointment history.",
      },
    ],
  }),
  component: PatientFilePage,
});

function PatientFilePage() {
  const { patientId } = Route.useParams();
  const userQuery = useCurrentUserQuery();
  const role = userQuery.data?.role;

  const patientQuery = usePatientQuery(patientId);
  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const medicationsQuery = usePatientMedicationsQuery(patientId);
  const vitalsQuery = usePatientVitalsQuery(patientId);

  if (userQuery.isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-48 rounded-xl" />
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    );
  }

  if (role === "PATIENT") {
    return (
      <div className="surface-card grid place-items-center p-16 text-center">
        <span className="grid size-14 place-items-center rounded-3xl bg-destructive/10">
          <ShieldCheck className="size-6 text-destructive" />
        </span>
        <p className="mt-5 text-base font-semibold">Access restricted</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          This page is for doctors and administrators only.
        </p>
      </div>
    );
  }

  const patient = patientQuery.data;
  const name = patient ? `${patient.firstName} ${patient.lastName}` : "Patient";
  const canManage = role === "DOCTOR";

  const patientAppointments = (appointmentsQuery.data?.data ?? [])
    .filter((a) => a.patient?.id === patientId || a.patientId === patientId)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <Link
          to="/appointments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to appointments
        </Link>
      </motion.div>

      {/* ── Patient info ─────────────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="surface-card overflow-hidden">
        <div className="relative gradient-teal px-7 pb-16 pt-7">
          <div className="flex items-center gap-5">
            {patient?.photoUrl && (
              <img
                src={patient.photoUrl}
                alt={name}
                className="size-16 rounded-2xl object-cover ring-4 ring-card"
              />
            )}
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-primary-foreground">
                {name}
              </h2>
              <p className="mt-1 text-sm text-primary-foreground/80">
                {patient?.user?.email ?? "—"}
              </p>
            </div>
            <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-[11px] font-semibold text-success">
              <span className="size-1.5 rounded-full bg-success" />
              Patient file
            </span>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-4 px-7 py-6 text-xs sm:grid-cols-4">
          {[
            { label: "Phone", value: patient?.user?.phone ?? "—", icon: Phone },
            { label: "Blood type", value: patient?.bloodType ?? "—", icon: Droplets },
            { label: "Gender", value: patient?.gender ?? "—", icon: Stethoscope },
            {
              label: "Member since",
              value: patient?.memberSince?.slice(0, 10) ?? "—",
              icon: CalendarDays,
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-2.5">
              <item.icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <dt className="font-medium">{item.value}</dt>
                <dd className="mt-0.5 text-muted-foreground">{item.label}</dd>
              </div>
            </div>
          ))}
        </dl>
      </motion.section>

      {/* ── Appointment history ──────────────────────────────────────────────── */}
      <motion.section variants={fadeUp} className="surface-card p-7">
        <h3 className="text-base font-semibold tracking-tight">
          Appointment history{" "}
          <span className="ml-1 text-xs font-normal text-muted-foreground">
            ({patientAppointments.length})
          </span>
        </h3>
        {appointmentsQuery.isPending ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : patientAppointments.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-muted/60 p-6 text-sm text-muted-foreground">
            No appointments recorded with this patient.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {patientAppointments.map((appointment) => (
              <li
                key={appointment.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}{" "}
                    ·{" "}
                    {new Date(appointment.scheduledAt).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {appointment.clinicAddressSnapshot}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold capitalize text-primary">
                  {appointment.status.toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </motion.section>

      {/* ── Medications & vitals ─────────────────────────────────────────────── */}
      <motion.section variants={fadeUp}>
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
            <MedicationsSection
              patientId={patientId}
              canManage={canManage}
              medicationsQuery={medicationsQuery}
            />
          </TabsContent>
          <TabsContent value="vitals" className="space-y-5">
            <VitalsSection patientId={patientId} canManage={canManage} vitalsQuery={vitalsQuery} />
          </TabsContent>
        </Tabs>
      </motion.section>
    </motion.div>
  );
}

// ── Medications ────────────────────────────────────────────────────────────────

function MedicationsSection({
  patientId,
  canManage,
  medicationsQuery,
}: {
  patientId: string;
  canManage: boolean;
  medicationsQuery: ReturnType<typeof usePatientMedicationsQuery>;
}) {
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [scheduledTime, setScheduledTime] = useState("08:00");
  const create = useCreatePatientMedicationMutation(patientId);

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
          toast.success("Medication prescribed");
        },
        onError: (err) =>
          toast.error("Failed to prescribe", {
            description: err instanceof Error ? err.message : "Please try again.",
          }),
      },
    );
  };

  return (
    <>
      {canManage && (
        <div className="surface-card p-7">
          <h3 className="text-base font-semibold">Prescribe a medication</h3>
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
            <Plus className="size-4" /> {create.isPending ? "Prescribing…" : "Prescribe"}
          </Button>
        </div>
      )}

      <div className="surface-card p-7">
        <h3 className="text-base font-semibold">Medications</h3>
        {medicationsQuery.isPending ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : (medicationsQuery.data ?? []).length === 0 ? (
          <p className="mt-5 rounded-2xl bg-muted/60 p-6 text-sm text-muted-foreground">
            No medications on file for this patient.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {(medicationsQuery.data ?? []).map((med) => {
              const prescribed = Boolean(med.prescribedByDoctor);
              return (
                <li
                  key={med.id}
                  className="flex items-center gap-4 rounded-2xl border border-border/70 p-4"
                >
                  <span
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-2xl",
                      prescribed ? "bg-success/12 text-success" : "bg-primary-soft text-primary",
                    )}
                  >
                    <Pill className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{med.name}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          prescribed
                            ? "bg-success/12 text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {prescribed
                          ? `Prescribed by Dr. ${med.prescribedByDoctor!.firstName} ${med.prescribedByDoctor!.lastName}`
                          : "Patient self-tracked"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {med.dose} · {med.scheduledTime}
                      {!med.isActive && " · Inactive"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}

// ── Vitals ─────────────────────────────────────────────────────────────────────

function VitalsSection({
  patientId,
  canManage,
  vitalsQuery,
}: {
  patientId: string;
  canManage: boolean;
  vitalsQuery: ReturnType<typeof usePatientVitalsQuery>;
}) {
  const [heartRate, setHeartRate] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [steps, setSteps] = useState("");
  const create = useCreatePatientVitalMutation(patientId);

  const addVital = () => {
    const payload = {
      ...(heartRate !== "" ? { heartRate: Number(heartRate) } : {}),
      ...(systolic !== "" ? { systolic: Number(systolic) } : {}),
      ...(diastolic !== "" ? { diastolic: Number(diastolic) } : {}),
      ...(sleepHours !== "" ? { sleepHours: Number(sleepHours) } : {}),
      ...(steps !== "" ? { steps: Number(steps) } : {}),
    };
    create.mutate(payload, {
      onSuccess: () => {
        setHeartRate("");
        setSystolic("");
        setDiastolic("");
        setSleepHours("");
        setSteps("");
        toast.success("Vital recorded");
      },
      onError: (err) =>
        toast.error("Failed to record", {
          description: err instanceof Error ? err.message : "Please try again.",
        }),
    });
  };

  const records = [...(vitalsQuery.data ?? [])].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  return (
    <>
      {canManage && (
        <div className="surface-card p-7">
          <h3 className="text-base font-semibold">Record vitals</h3>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
            {[
              {
                id: "vr-hr",
                label: "Heart rate (bpm)",
                value: heartRate,
                set: setHeartRate,
                placeholder: "72",
              },
              {
                id: "vr-sys",
                label: "Systolic",
                value: systolic,
                set: setSystolic,
                placeholder: "120",
              },
              {
                id: "vr-dia",
                label: "Diastolic",
                value: diastolic,
                set: setDiastolic,
                placeholder: "80",
              },
              {
                id: "vr-sleep",
                label: "Sleep (h)",
                value: sleepHours,
                set: setSleepHours,
                placeholder: "7.5",
              },
              { id: "vr-steps", label: "Steps", value: steps, set: setSteps, placeholder: "8500" },
            ].map((field) => (
              <div key={field.id}>
                <Label htmlFor={field.id} className="text-xs font-medium text-muted-foreground">
                  {field.label}
                </Label>
                <Input
                  id={field.id}
                  type="number"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.placeholder}
                  className="mt-2 h-11 rounded-2xl"
                />
              </div>
            ))}
          </div>
          <Button onClick={addVital} disabled={create.isPending} className="mt-5 rounded-2xl">
            <Plus className="size-4" /> {create.isPending ? "Recording…" : "Record vitals"}
          </Button>
        </div>
      )}

      <div className="surface-card p-7">
        <h3 className="text-base font-semibold">Recent vitals</h3>
        {vitalsQuery.isPending ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : records.length === 0 ? (
          <p className="mt-5 rounded-2xl bg-muted/60 p-6 text-sm text-muted-foreground">
            No vital readings recorded for this patient.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {records.slice(0, 10).map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border/70 p-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {new Date(record.recordedAt).toLocaleDateString("en-US", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {record.recordedByDoctor
                      ? `Recorded by Dr. ${record.recordedByDoctor.firstName} ${record.recordedByDoctor.lastName}`
                      : "Self-tracked by patient"}
                  </p>
                </div>
                <div className="flex gap-5 text-sm">
                  <div className="text-right">
                    <p className="font-semibold tabular-nums">{record.heartRate ?? "—"}</p>
                    <p className="text-[11px] text-muted-foreground">HR</p>
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
                    <p className="text-[11px] text-muted-foreground">Sleep</p>
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
      </div>
    </>
  );
}
