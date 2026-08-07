import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { HeartPulse, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account-restricted")({
  head: () => ({
    meta: [
      { title: "Account restricted — MediCare" },
      {
        name: "description",
        content: "Your MediCare account is currently restricted.",
      },
    ],
  }),
  component: AccountRestrictedPage,
});

function AccountRestrictedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg"
      >
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-destructive/10">
          <ShieldAlert className="size-7 text-destructive" />
        </div>

        <h1 className="mt-6 text-center text-2xl font-semibold tracking-tight">
          Account restricted
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
          Your account has been suspended or deactivated, so you can no longer access the platform.
          If you believe this is a mistake, please contact our support team.
        </p>

        <div className="mt-8 space-y-3">
          <Link to="/login">
            <Button className="w-full">Back to sign in</Button>
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
