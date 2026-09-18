import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "motion/react";
import { toast } from "sonner";
import { HeartPulse, Loader2, Mail, MailCheck, MailX, Send } from "lucide-react";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({
    meta: [
      { title: "Verify your email — MediCare" },
      {
        name: "description",
        content: "Confirm your email address to activate your MediCare account.",
      },
    ],
  }),
  component: VerifyEmailPage,
});

type Status = "loading" | "success" | "error";

const resendSchema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type ResendValues = z.infer<typeof resendSchema>;

function VerifyEmailPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<Status>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [showResend, setShowResend] = useState(false);
  const [countdown, setCountdown] = useState(3);

  const resendForm = useForm<ResendValues>({
    resolver: zodResolver(resendSchema),
    defaultValues: { email: "" },
  });

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(
        "This verification link is incomplete. Request a new link with your email address.",
      );
      return;
    }

    let active = true;
    authService
      .verifyEmail({ token })
      .then(() => {
        if (active) setStatus("success");
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "This link is invalid or has expired.",
        );
      });

    return () => {
      active = false;
    };
  }, [token]);

  useEffect(() => {
    if (status !== "success") return;
    setCountdown(3);
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

  useEffect(() => {
    if (status === "success" && countdown <= 0) {
      navigate({ to: "/login" });
    }
  }, [status, countdown, navigate]);

  const onResend = (values: ResendValues) => {
    authService
      .resendVerification({ email: values.email })
      .then(() => {
        toast.success("Verification link sent", {
          description: "Check your inbox — the link expires in 24 hours.",
        });
        setShowResend(false);
        resendForm.reset();
      })
      .catch((err) => {
        toast.error("Could not send the link", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      });
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full gradient-teal opacity-15 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="surface-card p-8 sm:p-10">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <div className="grid size-14 place-items-center rounded-2xl gradient-teal shadow-glow">
                <Loader2 className="size-7 animate-spin text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Verifying your email…</h1>
                <p className="mt-1 text-sm text-muted-foreground">Please wait one moment.</p>
              </div>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-emerald-500/10 shadow-glow">
                <MailCheck className="size-7 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Email verified</h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  Your address is confirmed and your account is now active. Redirecting to sign
                  in in {countdown}s…
                </p>
              </div>
              <Button className="mt-2 w-full" onClick={() => navigate({ to: "/login" })}>
                Go to sign in
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <div className="grid size-14 place-items-center rounded-2xl bg-destructive/10 shadow-glow">
                <MailX className="size-7 text-destructive" />
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Verification failed</h1>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {errorMessage}
                </p>
              </div>

              {!showResend && (
                <div className="mt-2 w-full space-y-3">
                  <Button className="w-full" onClick={() => setShowResend(true)}>
                    <Send className="size-4" /> Resend verification email
                  </Button>
                  <Link
                    to="/login"
                    className="block w-full text-center text-sm font-semibold text-primary transition-colors hover:underline"
                  >
                    Back to sign in
                  </Link>
                </div>
              )}

              {showResend && (
                <form
                  onSubmit={resendForm.handleSubmit(onResend, () =>
                    toast.error("Please fix the highlighted field"),
                  )}
                  className="mt-2 w-full space-y-4 text-left"
                >
                  <div>
                    <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
                      Account email address
                    </Label>
                    <div className="relative mt-2">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        {...resendForm.register("email")}
                        className="h-12 rounded-2xl pl-11"
                        aria-invalid={Boolean(resendForm.formState.errors.email)}
                      />
                    </div>
                    {resendForm.formState.errors.email && (
                      <p role="alert" className="mt-1.5 text-xs text-destructive">
                        {resendForm.formState.errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button type="submit" disabled={resendForm.formState.isSubmitting} className="w-full">
                    {resendForm.formState.isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      "Send a new link"
                    )}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          By continuing, you agree to MediCare&apos;s Terms of Service and Privacy Policy.
        </p>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <HeartPulse className="size-3.5" />
          <span>MediCare — your health, in one place.</span>
        </div>
      </motion.div>
    </div>
  );
}