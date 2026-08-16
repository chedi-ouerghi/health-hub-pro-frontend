import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  BadgeCheck,
  Building2,
  Moon,
  ShieldCheck,
  Stethoscope,
  Sun,
  Trash2,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { useUpdatePatientProfileMutation } from "@/hooks/api/use-patients";
import { useUpdateDoctorProfileMutation } from "@/hooks/api/use-doctors";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SecurityPanel } from "@/components/settings/security-panel";
import { ReferentialsManager } from "@/components/settings/referentials-manager";
import { uploadService } from "@/services/upload.service";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/stores/auth-store";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account Settings — MediCare" },
      {
        name: "description",
        content: "Manage your profile, notifications, privacy, security and connected devices.",
      },
      { property: "og:title", content: "Account Settings — MediCare" },
      {
        property: "og:description",
        content: "Update personal information, preferences and security options.",
      },
    ],
  }),
  component: SettingsPage,
});

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(7, "Enter a valid phone number"),
  address: z.string().min(5, "Enter your address"),
  emergencyName: z.string().min(2, "Enter a contact name"),
  emergencyPhone: z.string().min(7, "Enter a valid phone number"),
  language: z.string(),
});

type FormValues = z.infer<typeof schema>;

function SettingsPage() {
  const userQuery = useCurrentUserQuery();
  const role = userQuery.data?.role;

  if (role === "DOCTOR") return <DoctorSettings />;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return <AdminSettings />;
  return <PatientSettings />;
}

function PatientSettings() {
  const { theme, setTheme } = useTheme();
  const updateProfile = useUpdatePatientProfileMutation();
  const [prefs, setPrefs] = useState({
    appointments: true,
    reminders: true,
    marketing: false,
    research: false,
    profileVisible: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const userQuery = useCurrentUserQuery();
  const patient = userQuery.data?.patient;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      emergencyName: "",
      emergencyPhone: "",
      language: "English (US)",
    },
  });

  useEffect(() => {
    if (!patient) return;
    form.reset({
      fullName: `${patient.firstName} ${patient.lastName}`.trim(),
      email: userQuery.data?.email ?? "",
      phone: userQuery.data?.phone ?? "",
      address: patient.addressLine ?? "",
      emergencyName: patient.emergencyContactName ?? "",
      emergencyPhone: patient.emergencyContactPhone ?? "",
      language: "English (US)",
    });
  }, [patient, userQuery.data, form]);

  const onSubmit = (values: FormValues) => {
    const parts = values.fullName.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || firstName;

    updateProfile.mutate(
      {
        firstName,
        lastName,
        addressLine: values.address,
        emergencyContactName: values.emergencyName,
        emergencyContactPhone: values.emergencyPhone,
      },
      {
        onSuccess: () => {
          toast.success("Changes saved", { description: `Profile updated for ${values.fullName}` });
        },
        onError: (err) => {
          toast.error("Failed to save", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Unsupported file type", { description: "Use JPG, PNG or WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Images must be under 5 MB." });
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadService.upload(file);
      await new Promise<void>((resolve, reject) => {
        updateProfile.mutate(
          { photoUrl: url },
          {
            onSuccess: () => {
              void userQuery.refetch();
              resolve();
            },
            onError: reject,
          },
        );
      });
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const field = (name: keyof FormValues, label: string, type = "text") => (
    <div>
      <Label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        {...form.register(name)}
        className="mt-2 h-11 rounded-2xl"
        aria-invalid={Boolean(form.formState.errors[name])}
      />
      {form.formState.errors[name] && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.form
        variants={fadeUp}
        onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields"))}
        className="space-y-5"
      >
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Account settings</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your personal information, preferences and security.
            </p>
          </div>
          <Button type="submit" disabled={updateProfile.isPending} className="h-11 rounded-2xl px-6">
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>

        <div className="grid grid-cols-12 gap-5">
          <section className="col-span-8 surface-card p-7">
            <h3 className="text-base font-semibold">Personal information</h3>
            <div className="mt-5 flex items-center gap-5">
              {patient?.photoUrl ? (
                <img
                  src={patient.photoUrl}
                  alt="Patient"
                  width={512}
                  height={512}
                  className="size-20 rounded-3xl object-cover"
                />
              ) : (
                <span className="grid size-20 place-items-center rounded-3xl bg-primary-soft text-2xl font-semibold text-primary">
                  {patient?.firstName?.[0] ?? "P"}
                </span>
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    void handleAvatarChange(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading…" : "Upload new photo"}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">JPG, PNG or WebP, up to 5MB.</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              {field("fullName", "Full name")}
              {field("email", "Email address", "email")}
              {field("phone", "Phone number")}
              <div>
                <Label className="text-xs font-medium text-muted-foreground">Language</Label>
                <Select
                  value={form.watch("language")}
                  onValueChange={(v) => form.setValue("language", v)}
                >
                  <SelectTrigger className="mt-2 h-11 w-full rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["English (US)", "Français", "Español", "Deutsch"].map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">{field("address", "Address")}</div>
              {field("emergencyName", "Emergency contact name")}
              {field("emergencyPhone", "Emergency contact phone")}
            </div>
          </section>

          <aside className="col-span-4 space-y-5">
            <div className="surface-card p-7">
              <h3 className="text-base font-semibold">Appearance</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(
                  [
                    { key: "light", label: "Light", icon: Sun },
                    { key: "dark", label: "Dark", icon: Moon },
                  ] as const
                ).map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setTheme(option.key)}
                    aria-pressed={theme === option.key}
                    className={cn(
                      "rounded-2xl border p-4 transition-all",
                      theme === option.key
                        ? "border-primary/50 bg-primary-soft"
                        : "border-border hover:border-primary/30",
                    )}
                  >
                    <option.icon className="mx-auto size-4 text-primary" />
                    <span className="mt-2 block text-xs font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="surface-card p-7">
              <h3 className="text-base font-semibold">Notifications</h3>
              <div className="mt-4 space-y-4">
                {(
                  [
                    ["appointments", "Appointment updates"],
                    ["reminders", "Medication reminders"],
                    ["marketing", "Product news"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label htmlFor={key} className="text-sm">
                      {label}
                    </Label>
                    <Switch
                      id={key}
                      checked={prefs[key]}
                      onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </motion.form>

      <motion.div variants={fadeUp}>
        <SecurityPanel />
      </motion.div>

      <motion.section
        variants={fadeUp}
        className="rounded-3xl border border-destructive/30 bg-destructive/5 p-7"
      >
        <h3 className="flex items-center gap-2 text-base font-semibold text-destructive">
          <Trash2 className="size-4" /> Delete account
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Permanently remove your account, medical records and appointment history. This action
          cannot be undone.
        </p>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" className="mt-5 rounded-2xl">
              Delete my account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-3xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                All records, invoices and upcoming appointments will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="rounded-2xl"
                onClick={() => toast.error("Account deletion requested")}
              >
                Yes, delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.section>
    </motion.div>
  );
}

const doctorSchema = z.object({
  bio: z.string().min(10, "Please enter a short bio (at least 10 characters)"),
  consultationPrice: z.coerce
    .number()
    .min(1, "Enter a valid consultation price")
    .max(100000, "Price too high"),
  clinicName: z.string().min(2, "Enter your clinic name"),
  addressLine: z.string().min(5, "Enter your clinic address"),
  isAcceptingNewPatients: z.boolean(),
});

type DoctorFormValues = z.infer<typeof doctorSchema>;

function DoctorSettings() {
  const { theme, setTheme } = useTheme();
  const userQuery = useCurrentUserQuery();
  const doctor = userQuery.data?.doctor;
  const updateDoctor = useUpdateDoctorProfileMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Unsupported file type", { description: "Use JPG, PNG or WebP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", { description: "Images must be under 5 MB." });
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadService.upload(file);
      await new Promise<void>((resolve, reject) => {
        updateDoctor.mutate(
          { photoUrl: url },
          {
            onSuccess: () => {
              void userQuery.refetch();
              resolve();
            },
            onError: reject,
          },
        );
      });
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error("Upload failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const form = useForm<DoctorFormValues>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      bio: "",
      consultationPrice: 50,
      clinicName: "",
      addressLine: "",
      isAcceptingNewPatients: true,
    },
  });

  useEffect(() => {
    if (!doctor) return;
    form.reset({
      bio: doctor.bio ?? "",
      consultationPrice: Number(doctor.consultationPrice) || 50,
      clinicName: doctor.clinicName ?? "",
      addressLine: doctor.addressLine ?? "",
      isAcceptingNewPatients: doctor.isAcceptingNewPatients ?? true,
    });
  }, [doctor, form]);

  const onSubmit = (values: DoctorFormValues) => {
    updateDoctor.mutate(
      {
        bio: values.bio,
        consultationPrice: String(values.consultationPrice),
        clinicName: values.clinicName,
        addressLine: values.addressLine,
        isAcceptingNewPatients: values.isAcceptingNewPatients,
      },
      {
        onSuccess: () => {
          toast.success("Changes saved", {
            description: `Profile updated for Dr ${doctor?.lastName ?? ""}`.trim(),
          });
        },
        onError: (err) => {
          toast.error("Failed to save", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  const field = (name: keyof DoctorFormValues, label: string, type = "text") => (
    <div>
      <Label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        {...form.register(name)}
        className="mt-2 h-11 rounded-2xl"
        aria-invalid={Boolean(form.formState.errors[name])}
      />
      {form.formState.errors[name] && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <motion.form
      variants={stagger}
      initial="hidden"
      animate="show"
      onSubmit={form.handleSubmit(onSubmit, () => toast.error("Please fix the highlighted fields"))}
      className="space-y-5"
    >
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Practice settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your professional profile, pricing and clinic information.
          </p>
        </div>
        <Button type="submit" disabled={updateDoctor.isPending} className="h-11 rounded-2xl px-6">
          {updateDoctor.isPending ? "Saving…" : "Save changes"}
        </Button>
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        <motion.section variants={fadeUp} className="col-span-8 surface-card p-7">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <Stethoscope className="size-4 text-primary" /> Professional information
          </h3>

          {doctor && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary-soft p-4 text-sm">
              <BadgeCheck className="size-5 shrink-0 text-primary" />
              <span>
                {doctor.isLicenseVerified
                  ? "Your medical license is verified."
                  : "Your medical license is pending verification."}
              </span>
            </div>
          )}

          <div className="mt-6 grid grid-cols-2 gap-5">
            <div className="col-span-2 flex items-center gap-4">
              {doctor?.photoUrl && (
                <img
                  src={doctor.photoUrl}
                  alt="Doctor"
                  width={512}
                  height={512}
                  className="size-16 rounded-3xl object-cover"
                />
              )}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    void handleAvatarChange(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? "Uploading…" : "Upload new photo"}
                </Button>
                <p className="mt-1.5 text-xs text-muted-foreground">JPG, PNG or WebP, up to 5MB.</p>
              </div>
            </div>
            {field("bio", "Bio")}
            {field("clinicName", "Clinic name")}
            <div className="col-span-2">{field("addressLine", "Clinic address")}</div>
            <div>
              <Label
                htmlFor="consultationPrice"
                className="text-xs font-medium text-muted-foreground"
              >
                Consultation price
              </Label>
              <Input
                id="consultationPrice"
                type="number"
                step="0.01"
                {...form.register("consultationPrice")}
                className="mt-2 h-11 rounded-2xl"
                aria-invalid={Boolean(form.formState.errors.consultationPrice)}
              />
              {form.formState.errors.consultationPrice && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.consultationPrice?.message}
                </p>
              )}
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Currency</Label>
              <div className="mt-2 grid h-11 place-items-start rounded-2xl border border-border px-4 pt-2.5 text-sm text-muted-foreground">
                {doctor?.currency ?? "USD"}
              </div>
            </div>
            <div className="col-span-2 flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <Label htmlFor="isAcceptingNewPatients" className="text-sm font-medium">
                  Accepting new patients
                </Label>
                <p className="text-xs text-muted-foreground">
                  Show your availability to patients looking for a doctor.
                </p>
              </div>
              <Switch
                id="isAcceptingNewPatients"
                checked={form.watch("isAcceptingNewPatients")}
                onCheckedChange={(v) => form.setValue("isAcceptingNewPatients", v)}
              />
            </div>
          </div>
        </motion.section>

        <motion.section variants={fadeUp} className="col-span-4 space-y-5">
          <div className="surface-card p-7">
            <h3 className="text-base font-semibold">Appearance</h3>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  { key: "light", label: "Light", icon: Sun },
                  { key: "dark", label: "Dark", icon: Moon },
                ] as const
              ).map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setTheme(option.key)}
                  aria-pressed={theme === option.key}
                  className={cn(
                    "rounded-2xl border p-4 transition-all",
                    theme === option.key
                      ? "border-primary/50 bg-primary-soft"
                      : "border-border hover:border-primary/30",
                  )}
                >
                  <option.icon className="mx-auto size-4 text-primary" />
                  <span className="mt-2 block text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="surface-card p-7">
            <h3 className="flex items-center gap-2 text-base font-semibold">
              <Building2 className="size-4 text-primary" /> Clinic
            </h3>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Name</dt>
                <dd className="font-medium">{doctor?.clinicName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="font-medium">{doctor?.addressLine ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">City</dt>
                <dd className="font-medium">{doctor?.city ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Specialty</dt>
                <dd className="font-medium">{doctor?.specialty?.name ?? "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="surface-card p-7">
            <h3 className="text-base font-semibold">Notifications</h3>
            <div className="mt-4 space-y-4">
              {(["appointments", "reminders"] as const).map((key) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`dr-${key}`} className="text-sm">
                    {key === "appointments" ? "Appointment updates" : "Medication reminders"}
                  </Label>
                  <Switch id={`dr-${key}`} defaultChecked />
                </div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>

      <motion.div variants={fadeUp}>
        <SecurityPanel />
      </motion.div>
    </motion.form>
  );
}

function AdminSettings() {
  const { theme, setTheme } = useTheme();
  const userQuery = useCurrentUserQuery();
  const admin = userQuery.data;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Account settings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your administrator profile, security and platform referentials.
          </p>
        </div>
      </motion.div>

      <motion.section variants={fadeUp} className="grid grid-cols-12 gap-5">
        <div className="col-span-8 surface-card p-7">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="size-4 text-primary" /> Administrator account
          </h3>
          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{admin?.email ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="font-medium">{admin?.role ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="col-span-4 surface-card p-7">
          <h3 className="text-base font-semibold">Appearance</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {(
              [
                { key: "light", label: "Light", icon: Sun },
                { key: "dark", label: "Dark", icon: Moon },
              ] as const
            ).map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setTheme(option.key)}
                aria-pressed={theme === option.key}
                className={cn(
                  "rounded-2xl border p-4 transition-all",
                  theme === option.key
                    ? "border-primary/50 bg-primary-soft"
                    : "border-border hover:border-primary/30",
                )}
              >
                <option.icon className="mx-auto size-4 text-primary" />
                <span className="mt-2 block text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.div variants={fadeUp}>
        <SecurityPanel />
      </motion.div>

      <motion.div variants={fadeUp}>
        <ReferentialsManager />
      </motion.div>
    </motion.div>
  );
}
