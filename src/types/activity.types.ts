import type { PaginationMeta } from "./api.types";

export type ActivityType = "FILE" | "PRESCRIPTION" | "APPOINTMENT" | "INVOICE" | "MESSAGE";

export interface ActivityLog {
  id: string;
  patientId: string;
  type: ActivityType;
  title: string;
  meta: string | null;
  createdAt: string;
}

export interface ActivityLogsResult {
  logs: ActivityLog[];
  meta: PaginationMeta;
}
