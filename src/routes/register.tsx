import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";
import { useRegisterMutation } from "@/hooks/api/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — MediCare" },
      {
        name: "description",
        content:
          "Create your MediCare patient account to book consultations and track your health.",
      },
    ],
  }),
  component: RegisterPage,
});

const schema = z
  .object({
    firstName: z.string().min(2, "Enter your first name"),
    lastName: z.string().min(2, "Enter your last name"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function RegisterPage() {
  const navigate = useNavigate();
  const register = useRegisterMutation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = (values: FormValues) => {
    register.mutate(
      {
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email,
        password: values.password,
        role: "PATIENT",
      },
      {
        onSuccess: (data) => {
          toast.success("Account created", {
            description:
              data.verificationToken != null
                ? "Please check your email to verify your account."
                : "Your account is ready. Please sign in.",
          });
          navigate({ to: "/login" });
        },
        onError: (err) => {
          toast.error("Registration failed", {
            description:
              err instanceof Error ? err.message : "Please check your details and try again.",
          });
        },
      },
    );
  };

  const field = (name: keyof FormValues, label: string, type = "text") => (
    <div>
      <Label htmlFor={name} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <div className="relative mt-2">
        <Input
          id={name}
          type={type}
          {...form.register(name)}
          className="h-12 rounded-2xl"
          aria-invalid={Boolean(form.formState.errors[name])}
        />
      </div>
      {form.formState.errors[name] && (
        <p role="alert" className="mt-1.5 text-xs text-destructive">
          {form.formState.errors[name]?.message}
        </p>
      )}
    </div>
  );

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full gradient-teal opacity-15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg"
      >
        <div className="surface-card p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="MediCare logo"
              className="size-11 rounded-2xl object-cover shadow-glow"
            />
            <div>
              <p className="text-lg font-semibold tracking-tight">Create your account</p>
              <p className="text-xs text-muted-foreground">Join MediCare as a patient</p>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit, () =>
              toast.error("Please fix the highlighted fields"),
            )}
            className="mt-8 space-y-5"
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-xs font-medium text-muted-foreground">
                  First name
                </Label>
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    placeholder="John"
                    {...form.register("firstName")}
                    className="h-12 rounded-2xl pl-11"
                    aria-invalid={Boolean(form.formState.errors.firstName)}
                  />
                </div>
                {form.formState.errors.firstName && (
                  <p role="alert" className="mt-1.5 text-xs text-destructive">
                    {form.formState.errors.firstName.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs font-medium text-muted-foreground">
                  Last name
                </Label>
                <div className="relative mt-2">
                  <User className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    placeholder="Doe"
                    {...form.register("lastName")}
                    className="h-12 rounded-2xl pl-11"
                    aria-invalid={Boolean(form.formState.errors.lastName)}
                  />
                </div>
                {form.formState.errors.lastName && (
                  <p role="alert" className="mt-1.5 text-xs text-destructive">
                    {form.formState.errors.lastName.message}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                Email address
              </Label>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...form.register("email")}
                  className="h-12 rounded-2xl pl-11"
                  aria-invalid={Boolean(form.formState.errors.email)}
                />
              </div>
              {form.formState.errors.email && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  {...form.register("password")}
                  className="h-12 rounded-2xl pl-11 pr-11"
                  aria-invalid={Boolean(form.formState.errors.password)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.password && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label
                htmlFor="confirmPassword"
                className="text-xs font-medium text-muted-foreground"
              >
                Confirm password
              </Label>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Repeat your password"
                  {...form.register("confirmPassword")}
                  className="h-12 rounded-2xl pl-11 pr-11"
                  aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {form.formState.errors.confirmPassword && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={register.isPending}
              className="h-12 w-full rounded-2xl text-sm"
            >
              {register.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-2 rounded-2xl bg-muted/60 p-4">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              By signing up you agree to our Terms and Privacy Policy. Your health data is encrypted
              and never shared without consent.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary transition-colors hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
