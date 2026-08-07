import { useMemo, useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { Bell, ChevronDown, LogOut, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useDoctorsQuery } from "@/hooks/api/use-doctors";
import { useCurrentUserQuery, useLogoutMutation } from "@/hooks/api/use-auth";
import {
  useMarkNotificationReadMutation,
  useNotificationsQuery,
} from "@/hooks/api/use-notifications";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { roleLabel } from "@/lib/role-utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const labels: Record<string, string> = {
  "": "Overview",
  "find-doctor": "Find Doctor",
  doctors: "Doctors",
  appointments: "Appointments",
  history: "History",
  reviews: "Reviews",
  billing: "Billing",
  "health-records": "Health Records",
  availabilities: "Availability",
  settings: "Settings",
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

export function Topbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [query, setQuery] = useState("");
  const logout = useLogoutMutation();

  const userQuery = useCurrentUserQuery();
  const segments = pathname.split("/").filter(Boolean);
  const searching = query.trim().length > 0;
  const onDoctorDetail = segments.length > 1;
  const doctorsQuery = useDoctorsQuery({ limit: 100 }, { enabled: searching || onDoctorDetail });
  const notificationsQuery = useNotificationsQuery();
  const markRead = useMarkNotificationReadMutation();

  const user = userQuery.data;
  const patient = user?.patient;
  const doctor = user?.doctor;
  const displayName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : doctor
      ? `${doctor.firstName} ${doctor.lastName}`
      : "Administrator";
  const notifications = notificationsQuery.data?.notifications ?? [];
  const unread = notificationsQuery.data?.unreadCount ?? 0;

  const section = labels[segments[0] ?? ""] ?? "Overview";
  const detailDoctor =
    segments.length > 1 ? doctorsQuery.data?.data?.find((d) => d.id === segments[1]) : undefined;
  const detail = detailDoctor ? `${detailDoctor.firstName} ${detailDoctor.lastName}` : undefined;

  const today = useMemo(
    () =>
      new Date().toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (doctorsQuery.data?.data ?? [])
      .filter((d) =>
        `${d.firstName} ${d.lastName} ${d.specialty?.name ?? ""}`.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [query, doctorsQuery.data]);

  const markAllRead = () => {
    for (const n of notifications) {
      if (!n.isRead) markRead.mutate(n.id);
    }
  };

  const signOut = () => {
    logout.mutate(undefined, {
      onSuccess: () => window.location.reload(),
      onError: () => window.location.reload(),
    });
  };

  return (
    <header className="sticky top-0 z-20 glass-panel border-b border-border">
      <div className="flex h-20 items-center gap-6 px-8">
        <div className="min-w-[220px]">
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <Link to="/" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <span>/</span>
            <span className={cn(!detail && "text-foreground font-medium")}>{section}</span>
            {detail && (
              <>
                <span>/</span>
                <span className="font-medium text-foreground">{detail}</span>
              </>
            )}
          </nav>
          <h1 className="mt-0.5 text-[15px] font-semibold tracking-tight">
            Welcome back, {patient?.firstName ?? doctor?.firstName ?? "there"}
          </h1>
        </div>

        <div className="relative flex-1 max-w-xl">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors, specialties…"
            aria-label="Search doctors"
            className="h-11 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
          <AnimatePresence>
            {results.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute left-0 right-0 top-13 z-50 overflow-hidden rounded-2xl border border-border bg-popover p-2 shadow-lg"
              >
                {results.map((d) => (
                  <li key={d.id}>
                    <button
                      onClick={() => {
                        setQuery("");
                        navigate({ to: "/find-doctor/$doctorId", params: { doctorId: d.id } });
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      {d.photoUrl && (
                        <img
                          src={d.photoUrl}
                          alt=""
                          loading="lazy"
                          className="size-8 rounded-full object-cover"
                        />
                      )}
                      <span className="text-sm font-medium">
                        {d.firstName} {d.lastName}
                      </span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {d.specialty?.name ?? ""}
                      </span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground xl:block">{today}</span>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label="Toggle theme"
            className="size-10 rounded-2xl"
          >
            {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                aria-label={`Notifications, ${unread} unread`}
                className="relative grid size-10 place-items-center rounded-2xl transition-colors hover:bg-muted"
              >
                <Bell className="size-[18px]" />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-88 rounded-2xl p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold">Notifications</p>
                <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                  Mark all read
                </button>
              </div>
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted-foreground">No notifications.</p>
              ) : (
                <ul className="max-h-80 overflow-y-auto scroll-slim p-2">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <button
                        onClick={() => {
                          if (!n.isRead) markRead.mutate(n.id);
                        }}
                        className="flex w-full gap-3 rounded-xl p-3 text-left transition-colors hover:bg-muted"
                      >
                        <span
                          className={cn(
                            "mt-1.5 size-2 shrink-0 rounded-full",
                            n.isRead ? "bg-border" : "bg-primary",
                          )}
                        />
                        <span className="flex-1">
                          <span className="block text-sm font-medium leading-snug">{n.title}</span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {n.body}
                          </span>
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-2xl border border-border bg-card py-1.5 pl-1.5 pr-3 transition-colors hover:bg-muted">
                {patient?.photoUrl ? (
                  <img
                    src={patient.photoUrl}
                    alt={displayName}
                    width={512}
                    height={512}
                    className="size-9 rounded-xl object-cover"
                  />
                ) : doctor?.photoUrl ? (
                  <img
                    src={doctor.photoUrl}
                    alt={displayName}
                    width={512}
                    height={512}
                    className="size-9 rounded-xl object-cover"
                  />
                ) : (
                  <span className="grid size-9 place-items-center rounded-xl bg-primary-soft">
                    <User className="size-4 text-primary" />
                  </span>
                )}
                <span className="text-left leading-tight">
                  <span className="block text-[13px] font-semibold">{displayName}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {roleLabel(user?.role)}
                  </span>
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-2xl">
              <DropdownMenuLabel>{user?.email ?? "Signed in"}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <User className="size-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="size-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={signOut}
                disabled={logout.isPending}
              >
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
