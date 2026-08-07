import type { PaginationMeta } from "./api.types";

export type NotificationType =
  | "APPOINTMENT_REMINDER"
  | "APPOINTMENT_CONFIRMED"
  | "APPOINTMENT_CANCELLED"
  | "LAB_RESULT"
  | "PRESCRIPTION"
  | "INVOICE"
  | "SYSTEM";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  meta: PaginationMeta;
}
