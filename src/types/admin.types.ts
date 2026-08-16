import type { Specialty, FocusArea, DoctorLanguage } from "../types/doctor.types";
import type { UserSession } from "../types/security.types";

export interface AdminSpecialtyDto {
  name: string;
  description?: string;
}

export interface AdminLanguageDto {
  name: string;
  code: string;
}

export interface AdminFocusAreaDto {
  name: string;
}

export interface AdminReferentialsList {
  specialties: Specialty[];
  languages: DoctorLanguage[];
  focusAreas: FocusArea[];
}

export interface AdminUserList {
  users: unknown[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminSessionList {
  sessions: (UserSession & { userId: string; user?: { email: string; role: string } })[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AdminAuditLog {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: unknown;
  createdAt: string;
  user?: { id: string; email: string; role: string } | null;
}