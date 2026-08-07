import { createFileRoute, Navigate, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";

// Server-only access to the incoming Cookie header. createServerFn keeps the
// @tanstack/react-start/server import (h3, seroval, ssr internals) out of the
// client bundle entirely — importing it via createIsomorphicFn caused Vite to
// optimize those server deps for the client mid-session and reload the page,
// which corrupted React's dispatcher ("Invalid hook call" / useState on null).
const getCookieHeader = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestHeaders } = await import("@tanstack/react-start/server");
  return getRequestHeaders().get("cookie") ?? "";
});

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Server-side guard only: without an access_token cookie, respond with a
    // real redirect to /login so protected routes never render for guests on
    // SSR. Client-side auth stays render-driven via <Navigate /> below, so skip
    // the network round-trip (and never call the server fn) in the browser.
    if (typeof window === "undefined") {
      const cookie = await getCookieHeader();
      if (!cookie.includes("access_token=")) {
        throw redirect({ to: "/login" });
      }
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  // Loads the current user (cookie/header authenticated). Navigation is
  // render-driven via <Navigate /> — never throw redirect() during render.
  const userQuery = useCurrentUserQuery();
  const user = userQuery.data;

  if (userQuery.isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (userQuery.isError || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status === "PENDING_VERIFICATION") {
    return <Navigate to="/verify-email-pending" replace />;
  }

  if (user.status === "SUSPENDED" || user.status === "DEACTIVATED") {
    return <Navigate to="/account-restricted" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
