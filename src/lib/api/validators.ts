import { z } from "zod";

// ── Auth Schemas ──────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum(["PATIENT", "DOCTOR", "ADMIN", "SUPER_ADMIN"]);
export const UserStatusSchema = z.enum([
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
]);

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  phone: z.string().nullable().optional(),
  role: UserRoleSchema,
  status: UserStatusSchema,
  emailVerifiedAt: z.string().nullable().optional(),
  lastLoginAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  patient: z.any().optional(),
  doctor: z.any().optional(),
});

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.string(),
});

// ── Appointment Schemas ────────────────────────────────────────────────────────

export const AppointmentStatusSchema = z.enum([
  "UPCOMING",
  "COMPLETED",
  "CANCELLED",
  "RESCHEDULED",
  "NO_SHOW",
]);

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  scheduledAt: z.string(),
  durationMinutes: z.number(),
  clinicAddressSnapshot: z.string(),
  status: AppointmentStatusSchema,
  price: z.union([z.number(), z.string()]),
  currency: z.string(),
  notes: z.string().nullable().optional(),
  cancelReason: z.string().nullable().optional(),
  createdAt: z.string(),
});
