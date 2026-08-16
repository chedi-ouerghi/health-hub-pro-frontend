import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "../types/api.types";
import type { Specialty, FocusArea, DoctorLanguage } from "../types/doctor.types";
import type { UserSession } from "../types/security.types";
import type {
  AdminSpecialtyDto,
  AdminLanguageDto,
  AdminFocusAreaDto,
  AdminAuditLog,
  AdminUserList,
  AdminSessionList,
} from "../types/admin.types";

interface ReferentialResource<T, P> {
  list: () => Promise<T[]>;
  create: (payload: P) => Promise<T>;
  update: (id: string, payload: Partial<P>) => Promise<T>;
  remove: (id: string) => Promise<{ message: string }>;
}

const referentialCrud = <T, P>(base: string): ReferentialResource<T, P> => ({
  list: async (): Promise<T[]> => {
    const res = await apiClient.get<ApiResponse<T[]>>(base);
    return unwrap(res);
  },
  create: async (payload: P): Promise<T> => {
    const res = await apiClient.post<ApiResponse<T>>(`/admin${base}`, payload);
    return unwrap(res);
  },
  update: async (id: string, payload: Partial<P>): Promise<T> => {
    const res = await apiClient.patch<ApiResponse<T>>(`/admin${base}/${id}`, payload);
    return unwrap(res);
  },
  remove: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/admin${base}/${id}`);
    return unwrap(res);
  },
});

export const adminService = {
  specialties: referentialCrud<Specialty, AdminSpecialtyDto>("/specialties"),
  languages: referentialCrud<DoctorLanguage, AdminLanguageDto>("/languages"),
  focusAreas: referentialCrud<FocusArea, AdminFocusAreaDto>("/focus-areas"),

  listUsers: async (params?: Record<string, unknown>): Promise<AdminUserList> => {
    const res = await apiClient.get<ApiResponse<AdminUserList>>("/admin/users", { params });
    return unwrap(res);
  },

  updateUserStatus: async (userId: string, status: string): Promise<{ id: string; status: string }> => {
    const res = await apiClient.patch<ApiResponse<{ id: string; status: string }>>(
      `/admin/users/${userId}/status`,
      { status },
    );
    return unwrap(res);
  },

  listSessions: async (params?: Record<string, unknown>): Promise<AdminSessionList> => {
    const res = await apiClient.get<ApiResponse<AdminSessionList>>("/admin/sessions", { params });
    return unwrap(res);
  },

  revokeSession: async (sessionId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/admin/sessions/${sessionId}`);
    return unwrap(res);
  },

  listAuditLogs: async (params?: Record<string, unknown>): Promise<PaginatedResponse<AdminAuditLog>> => {
    const res = await apiClient.get<ApiResponse<{ logs: AdminAuditLog[]; meta: PaginationMeta }>>(
      "/admin/audit-logs",
      { params },
    );
    const result = unwrap(res);
    return { data: result.logs, meta: result.meta };
  },

  getStats: async (): Promise<Record<string, unknown>> => {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>("/stats");
    return unwrap(res);
  },
};

export type ActiveSession = AdminSessionList["sessions"][number];
export type { AdminAuditLog };