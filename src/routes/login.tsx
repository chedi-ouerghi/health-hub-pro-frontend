import { useState } from "react";
import { createFileRoute, Link, Navigate, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useCurrentUserQuery, useLoginMutation } from "@/hooks/api/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — MediCare" },
      {
        name: "description",
        content: "Sign in to your MediCare account to manage appointments, vitals and records.",
      },
    ],
  }),
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const navigate = useNavigate();
  const login = useLoginMutation();
  const userQuery = useCurrentUserQuery();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  // If a session already exists (e.g. valid cookie after a refresh), go to the
  // appropriate landing page for the user's status.
  if (userQuery.isSuccess) {
    const currentUser = userQuery.data;
    if (currentUser.status === "PENDING_VERIFICATION") {
      return <Navigate to="/verify-email-pending" replace />;
    }
    if (currentUser.status === "SUSPENDED" || currentUser.status === "DEACTIVATED") {
      return <Navigate to="/account-restricted" replace />;
    }
    return <Navigate to="/" replace />;
  }

  const onSubmit = (values: FormValues) => {
    login.mutate(values, {
      onSuccess: () => {
        toast.success("Welcome back", { description: "You're now signed in to MediCare." });
        navigate({ to: "/" });
      },
      onError: (err) => {
        toast.error("Sign in failed", {
          description: err instanceof Error ? err.message : "Please check your credentials.",
        });
      },
    });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full gradient-teal opacity-15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-24 size-96 rounded-full bg-primary/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="surface-card p-8 sm:p-10">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="MediCare logo"
              className="size-11 rounded-2xl object-cover shadow-glow"
            />
            <div>
              <p className="text-lg font-semibold tracking-tight">MediCare</p>
              <p className="text-xs text-muted-foreground">Sign in to your patient account</p>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit, () =>
              toast.error("Please fix the highlighted fields"),
            )}
            className="mt-8 space-y-5"
          >
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
                  Password
                </Label>
                <span className="text-xs text-muted-foreground">8+ characters</span>
              </div>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
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

            <Button
              type="submit"
              disabled={login.isPending}
              className="h-12 w-full rounded-2xl text-sm"
            >
              {login.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-6 rounded-2xl bg-muted/60 p-4 text-center">
            <p className="text-xs text-muted-foreground">
              New to MediCare?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary transition-colors hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          By continuing, you agree to MediCare&apos;s Terms of Service and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
}
