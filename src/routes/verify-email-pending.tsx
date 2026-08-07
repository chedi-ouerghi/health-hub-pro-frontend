import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { HeartPulse, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/verify-email-pending")({
  head: () => ({
    meta: [
      { title: "Verify your email — MediCare" },
      {
        name: "description",
        content: "Please check your inbox to verify your email before accessing MediCare.",
      },
    ],
  }),
  component: VerifyEmailPendingPage,
});

function VerifyEmailPendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-2xl gradient-teal shadow-glow">
          <MailCheck className="size-7 text-primary-foreground" />
        </div>

        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">Check your inbox</h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
          Your account hasn&apos;t been verified yet. We&apos;ve sent a verification link to your
          email — open it to activate your account. You&apos;ll be able to access the platform once
          your email is verified.
        </p>

        <div className="mt-8 space-y-3">
          <Link to="/login">
            <Button className="w-full">Go to sign in</Button>
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <HeartPulse className="size-3.5" />
          <span>MediCare — your health, in one place.</span>
        </div>
      </motion.div>
    </div>
  );
}
