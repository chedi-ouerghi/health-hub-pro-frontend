import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ChevronLeft, HeartPulse, MessageSquare, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { itemsForRole } from "@/lib/role-utils";

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const userQuery = useCurrentUserQuery();
  const items = itemsForRole(userQuery.data?.role);

  return (
    <motion.aside
      animate={{ width: collapsed ? 88 : 264 }}
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className="sticky top-0 z-30 flex h-screen shrink-0 flex-col border-r border-sidebar-border bg-sidebar"
    >
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl gradient-teal shadow-glow">
          <HeartPulse className="size-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg font-semibold tracking-tight"
          >
            MediCare
          </motion.span>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 px-4 py-4" aria-label="Main">
        {items.map((item) => {
          const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group relative flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors",
                active
                  ? "text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active"
                  transition={{ type: "spring", stiffness: 320, damping: 32 }}
                  className="absolute inset-0 rounded-2xl bg-sidebar-accent"
                />
              )}
              <Icon className="relative size-[18px] shrink-0" />
              {!collapsed && <span className="relative truncate">{item.label}</span>}
              {active && !collapsed && (
                <span className="relative ml-auto size-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="mx-4 mb-4 rounded-3xl gradient-surface border border-sidebar-border p-5">
          <MessageSquare className="size-6 text-primary" />
          <p className="mt-3 text-sm font-semibold leading-snug">Messaging</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Chat with your doctors will be available soon.
          </p>
        </div>
      )}

      <div className="border-t border-sidebar-border p-4">
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <ChevronLeft
            className={cn(
              "size-[18px] transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
        {collapsed && (
          <div className="mt-2 grid place-items-center py-1">
            <Search className="size-[18px] text-muted-foreground" />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
