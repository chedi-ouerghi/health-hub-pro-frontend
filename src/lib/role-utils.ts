import {
  CalendarClock,
  CalendarDays,
  CreditCard,
  FileHeart,
  LayoutDashboard,
  Settings,
  Star,
  Stethoscope,
  Users,
  type LucideIcon,
} from "lucide-react";
import { PatientDashboard } from "@/components/dashboard/patient-dashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import type { UserRole } from "@/types/auth.types";

export interface SidebarItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const patientItems: SidebarItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/find-doctor", label: "Find Doctor", icon: Stethoscope },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/history", label: "History", icon: CalendarClock },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/health-records", label: "Health Records", icon: FileHeart },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const doctorItems: SidebarItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/history", label: "History", icon: CalendarClock },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/availabilities", label: "Availability", icon: Stethoscope },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const adminItems: SidebarItem[] = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/appointments", label: "Appointments", icon: CalendarDays },
  { to: "/doctors", label: "Doctors", icon: Users },
  { to: "/history", label: "History", icon: CalendarClock },
  { to: "/billing", label: "Billing", icon: CreditCard },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function itemsForRole(role: UserRole | undefined): SidebarItem[] {
  if (role === "DOCTOR") return doctorItems;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return adminItems;
  return patientItems;
}

export function roleLabel(role: UserRole | undefined): string {
  return (role ?? "PATIENT")
    .toLowerCase()
    .replace("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function dashboardForRole(role: UserRole | undefined) {
  if (role === "DOCTOR") return DoctorDashboard;
  if (role === "ADMIN" || role === "SUPER_ADMIN") return AdminDashboard;
  return PatientDashboard;
}
