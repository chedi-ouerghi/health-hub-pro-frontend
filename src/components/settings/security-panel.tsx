import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { BadgeCheck, KeyRound, Laptop, Monitor, PhoneCall, QrCode, ShieldCheck, Smartphone, Tablet } from "lucide-react";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import {
  useMySessionsQuery,
  useRevokeMySessionMutation,
  useChangePasswordMutation,
  useEnableTwoFactorMutation,
  useDisableTwoFactorMutation,
  useRequestPhoneVerificationMutation,
  useConfirmPhoneVerificationMutation,
} from "@/hooks/api/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import type { UserSession } from "@/types/security.types";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/^(?=.*[a-zA-Z])(?=.*\d).+$/, "Must contain letters and at least one digit"),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type PasswordValues = z.infer<typeof passwordSchema>;

export function PasswordCard() {
  const changePassword = useChangePasswordMutation();
  const [done, setDone] = useState(false);

  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const onSubmit = (values: PasswordValues) => {
    changePassword.mutate(
      { currentPassword: values.currentPassword, newPassword: values.newPassword },
      {
        onSuccess: () => {
          setDone(true);
          form.reset();
          toast.success("Password updated", {
            description: "Other devices have been signed out.",
          });
        },
        onError: (err) => {
          toast.error("Could not update password", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  return (
    <section className="surface-card p-7">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <KeyRound className="size-4 text-primary" /> Password
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Changing your password signs out every other connected device.
      </p>
      {done ? (
        <p className="mt-5 rounded-2xl bg-success/12 px-4 py-3 text-sm text-success">
          Your password has been updated.
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-5 space-y-4">
          <div>
            <Label htmlFor="pw-current" className="text-xs font-medium text-muted-foreground">
              Current password
            </Label>
            <Input
              id="pw-current"
              type="password"
              autoComplete="current-password"
              className="mt-2 h-11 rounded-2xl"
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword && (
              <p role="alert" className="mt-1.5 text-xs text-destructive">
                {form.formState.errors.currentPassword.message}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pw-new" className="text-xs font-medium text-muted-foreground">
                New password
              </Label>
              <Input
                id="pw-new"
                type="password"
                autoComplete="new-password"
                className="mt-2 h-11 rounded-2xl"
                {...form.register("newPassword")}
              />
              {form.formState.errors.newPassword && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="pw-confirm" className="text-xs font-medium text-muted-foreground">
                Confirm new password
              </Label>
              <Input
                id="pw-confirm"
                type="password"
                autoComplete="new-password"
                className="mt-2 h-11 rounded-2xl"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword && (
                <p role="alert" className="mt-1.5 text-xs text-destructive">
                  {form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
          <Button
            type="submit"
            variant="outline"
            className="rounded-2xl"
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? "Updating…" : "Update password"}
          </Button>
        </form>
      )}
    </section>
  );
}

function CodeField({
  value,
  onChange,
  label,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  id: string;
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">
        {label}
      </Label>
      <InputOTP
        id={id}
        maxLength={6}
        value={value}
        onChange={onChange}
        inputMode="numeric"
        pattern="[0-9]*"
        className="mt-2"
      >
        <InputOTPGroup className="gap-1">
          {[0, 1, 2].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="h-11 w-10 rounded-2xl border-border"
            />
          ))}
          <InputOTPSeparator />
          {[3, 4, 5].map((i) => (
            <InputOTPSlot
              key={i}
              index={i}
              className="h-11 w-10 rounded-2xl border-border"
            />
          ))}
        </InputOTPGroup>
      </InputOTP>
    </div>
  );
}

export function TwoFactorCard() {
  const userQuery = useCurrentUserQuery();
  const enabled = Boolean(userQuery.data?.twoFactorEnabled);
  const [step, setStep] = useState<"idle" | "qr" | "disable">("idle");
  const [secret, setSecret] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [code, setCode] = useState("");

  const enable = useEnableTwoFactorMutation();
  const disable = useDisableTwoFactorMutation();

  const startEnable = () => {
    setStep("qr");
    setCode("");
    enable.mutate(undefined, {
      onSuccess: (data) => {
        setSecret(data.secret);
        setQrCodeUrl(data.qrCodeUrl);
      },
      onError: (err) => {
        setStep("idle");
        toast.error("Could not start 2FA setup", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      },
    });
  };

  const confirmEnable = () => {
    if (code.length !== 6) return;
    enable.mutate(
      { code },
      {
        onSuccess: () => {
          setStep("idle");
          setSecret("");
          setQrCodeUrl("");
          setCode("");
          toast.success("Two-factor authentication enabled");
          void userQuery.refetch();
        },
        onError: (err) => {
          toast.error("Invalid code", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  const confirmDisable = () => {
    if (code.length !== 6) return;
    disable.mutate(
      { code },
      {
        onSuccess: () => {
          setStep("idle");
          setCode("");
          toast.success("Two-factor authentication disabled");
          void userQuery.refetch();
        },
        onError: (err) => {
          toast.error("Invalid code", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  return (
    <section className="surface-card p-7">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <ShieldCheck className="size-4 text-primary" /> Two-factor authentication
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {enabled
          ? "This account is protected by a one-time passcode at every sign-in."
          : "Add an extra security layer with a one-time passcode app."}
      </p>

      {step === "qr" && (
        <div className="mt-5 space-y-4 rounded-2xl border border-border p-5">
          {qrCodeUrl ? (
            <div className="flex items-start gap-4">
              <img
                src={qrCodeUrl}
                alt="Scan this QR code with your authenticator app"
                width={180}
                height={180}
                className="rounded-2xl border border-border"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Scan with your authenticator app</p>
                <p className="mt-2 break-all rounded-xl bg-muted/60 p-2 text-[11px] text-muted-foreground">
                  Secret: {secret}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Enter the 6-digit code from the app to confirm.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Generating QR code…</p>
          )}
          <CodeField id="2fa-code" label="6-digit code" value={code} onChange={setCode} />
          <div className="flex gap-2">
            <Button
              type="button"
              className="rounded-2xl"
              onClick={confirmEnable}
              disabled={code.length !== 6 || enable.isPending}
            >
              {enable.isPending ? "Confirming…" : "Confirm"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={() => {
                setStep("idle");
                setCode("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === "disable" && (
        <div className="mt-5 space-y-4 rounded-2xl border border-border p-5">
          <p className="text-sm text-muted-foreground">
            Enter the current code from your authenticator app to disable 2FA.
          </p>
          <CodeField id="2fa-disable-code" label="6-digit code" value={code} onChange={setCode} />
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              className="rounded-2xl"
              onClick={confirmDisable}
              disabled={code.length !== 6 || disable.isPending}
            >
              {disable.isPending ? "Disabling…" : "Disable 2FA"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-2xl"
              onClick={() => {
                setStep("idle");
                setCode("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-5">
        {enabled ? (
          <Button type="button" variant="outline" className="rounded-2xl" onClick={() => setStep("disable")}>
            Disable 2FA
          </Button>
        ) : (
          <Button type="button" variant="outline" className="rounded-2xl" onClick={startEnable} disabled={enable.isPending}>
            <QrCode className="size-4" />
            {enable.isPending && step === "qr" ? "Generating…" : "Set up 2FA"}
          </Button>
        )}
      </div>
    </section>
  );
}

export function PhoneVerificationCard() {
  const userQuery = useCurrentUserQuery();
  const user = userQuery.data;
  const verified = Boolean(user?.phoneVerifiedAt);
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | undefined>(undefined);

  const request = useRequestPhoneVerificationMutation();
  const confirm = useConfirmPhoneVerificationMutation();

  const sendCode = () => {
    request.mutate(
      { phone },
      {
        onSuccess: (data) => {
          setSent(true);
          setDevCode(data.devCode);
          toast.success("Verification code sent", {
            description: "The code expires in 10 minutes.",
          });
        },
        onError: (err) => {
          toast.error("Could not send code", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  const verify = () => {
    if (code.length !== 6) return;
    confirm.mutate(
      { code },
      {
        onSuccess: () => {
          setSent(false);
          setCode("");
          setDevCode(undefined);
          toast.success("Phone number verified");
          void userQuery.refetch();
        },
        onError: (err) => {
          toast.error("Invalid code", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  return (
    <section className="surface-card p-7">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <PhoneCall className="size-4 text-primary" /> Phone verification
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        A verified phone number strengthens account recovery and security alerts.
      </p>

      {verified ? (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-success/12 px-4 py-3 text-sm text-success">
          <BadgeCheck className="size-4" /> Verified
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          <div>
            <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">
              Phone number
            </Label>
            <Input
              id="phone"
              type="tel"
              className="mt-2 h-11 rounded-2xl"
              value={phone}
              disabled={sent}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          {sent && (
            <>
              {devCode && (
                <p className="rounded-2xl bg-primary-soft px-4 py-3 text-xs text-primary">
                  Development mode: your code is <span className="font-bold">{devCode}</span>
                </p>
              )}
              <CodeField id="phone-code" label="6-digit code" value={code} onChange={setCode} />
            </>
          )}
          <div className="flex gap-2">
            {!sent ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-2xl"
                onClick={sendCode}
                disabled={request.isPending || phone.trim().length < 7}
              >
                {request.isPending ? "Sending…" : "Send code"}
              </Button>
            ) : (
              <Button
                type="button"
                className="rounded-2xl"
                onClick={verify}
                disabled={code.length !== 6 || confirm.isPending}
              >
                {confirm.isPending ? "Verifying…" : "Verify"}
              </Button>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function SessionIcon({ session }: { session: UserSession }) {
  const Icon = session.deviceType === "MOBILE" ? Smartphone : session.deviceType === "TABLET" ? Tablet : Laptop;
  return (
    <span className="grid size-10 place-items-center rounded-2xl bg-primary-soft">
      <Icon className="size-4 text-primary" />
    </span>
  );
}

export function SessionsCard() {
  const sessionsQuery = useMySessionsQuery({ limit: 50 });
  const revoke = useRevokeMySessionMutation();

  const sessions = sessionsQuery.data?.data ?? [];

  const signOut = (sessionId: string, name: string) => {
    revoke.mutate(sessionId, {
      onSuccess: () => {
        toast.success("Signed out", { description: name });
      },
      onError: (err) => {
        toast.error("Could not sign out device", {
          description: err instanceof Error ? err.message : "Please try again.",
        });
      },
    });
  };

  return (
    <section className="surface-card p-7">
      <h3 className="flex items-center gap-2 text-base font-semibold">
        <Monitor className="size-4 text-primary" /> Connected devices
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Sessions signed in to your account across all browsers and apps.
      </p>

      {sessionsQuery.isPending ? (
        <p className="mt-5 text-sm text-muted-foreground">Loading sessions…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No active sessions.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {sessions.map((session) => {
            const name =
              session.deviceName ??
              (session.deviceType === "MOBILE" ? "Mobile device" : session.deviceType === "TABLET" ? "Tablet" : "Desktop browser");
            return (
              <li key={session.id} className="flex items-center gap-4 py-4">
                <SessionIcon session={session} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[session.location, session.ipAddress, session.lastActiveAt
                      ? `Last active ${new Date(session.lastActiveAt).toLocaleString()}`
                      : null]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                {session.isCurrent ? (
                  <span className="shrink-0 rounded-full bg-success/12 px-2.5 py-1 text-[10px] font-semibold text-success">
                    This device
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 rounded-2xl"
                    disabled={revoke.isPending}
                    onClick={() => signOut(session.id, name)}
                  >
                    Sign out
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function SecurityPanel() {
  return (
    <div className="grid grid-cols-12 gap-5">
      <div className="col-span-6 space-y-5">
        <PasswordCard />
        <SessionsCard />
      </div>
      <div className="col-span-6 space-y-5">
        <TwoFactorCard />
        <PhoneVerificationCard />
      </div>
    </div>
  );
}