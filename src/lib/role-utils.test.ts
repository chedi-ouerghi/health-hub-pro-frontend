import { describe, it, expect } from "vitest";
import {
  itemsForRole,
  roleLabel,
  dashboardForRole,
  patientItems,
  doctorItems,
  adminItems,
} from "./role-utils";
import { PatientDashboard } from "@/components/dashboard/patient-dashboard";
import { DoctorDashboard } from "@/components/dashboard/doctor-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

describe("itemsForRole", () => {
  it("returns patient items for PATIENT or undefined role", () => {
    expect(itemsForRole("PATIENT")).toBe(patientItems);
    expect(itemsForRole(undefined)).toBe(patientItems);
  });

  it("gives doctors Availability and hides Find Doctor / Health Records", () => {
    expect(itemsForRole("DOCTOR")).toBe(doctorItems);
    const labels = itemsForRole("DOCTOR").map((i) => i.to);
    expect(labels).toContain("/availabilities");
    expect(labels).not.toContain("/find-doctor");
    expect(labels).not.toContain("/health-records");
    expect(labels).toContain("/settings");
  });

  it("gives admins a reduced set without Reviews / Find Doctor / Health Records", () => {
    expect(itemsForRole("ADMIN")).toBe(adminItems);
    expect(itemsForRole("SUPER_ADMIN")).toBe(adminItems);
    const labels = itemsForRole("ADMIN").map((i) => i.to);
    expect(labels).not.toContain("/reviews");
    expect(labels).not.toContain("/find-doctor");
    expect(labels).not.toContain("/health-records");
  });
});

describe("roleLabel", () => {
  it("formats role names for display", () => {
    expect(roleLabel("PATIENT")).toBe("Patient");
    expect(roleLabel("DOCTOR")).toBe("Doctor");
    expect(roleLabel("ADMIN")).toBe("Admin");
    expect(roleLabel("SUPER_ADMIN")).toBe("Super Admin");
    expect(roleLabel(undefined)).toBe("Patient");
  });
});

describe("dashboardForRole", () => {
  it("maps each role to its dashboard", () => {
    expect(dashboardForRole("PATIENT")).toBe(PatientDashboard);
    expect(dashboardForRole("DOCTOR")).toBe(DoctorDashboard);
    expect(dashboardForRole("ADMIN")).toBe(AdminDashboard);
    expect(dashboardForRole("SUPER_ADMIN")).toBe(AdminDashboard);
    expect(dashboardForRole(undefined)).toBe(PatientDashboard);
  });
});
