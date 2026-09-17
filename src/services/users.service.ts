import { apiClient, unwrap } from "../lib/api/client";
import { UserSchema } from "../lib/api/validators";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "../types/api.types";
import type { User } from "../types/auth.types";
import type { Doctor, UpdateDoctorProfileDto } from "../types/doctor.types";
import type { Patient, UpdatePatientProfileDto } from "../types/patient.types";
import type {
    ChangePasswordDto,
    ConfirmEmailVerificationDto,
    EnableTwoFactorResponse,
    RequestEmailVerificationDto,
    RequestEmailVerificationResponse,
    TwoFactorCodeDto,
    UserSession,
} from "../types/security.types";

export const usersService = {
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>("/users/me");
    const data = unwrap(res);
    UserSchema.parse(data);
    return data;
  },

  updateMe: async (
    payload: UpdatePatientProfileDto | UpdateDoctorProfileDto,
  ): Promise<Patient | Doctor> => {
    const res = await apiClient.patch<ApiResponse<Patient | Doctor>>("/users/me", payload);
    return unwrap(res);
  },

  // ── My sessions (connected devices) ────────────────────────────────────────

  getMySessions: async (params?: { page?: number; limit?: number }): Promise<PaginatedResponse<UserSession>> => {
    const res = await apiClient.get<ApiResponse<{ sessions: UserSession[]; meta: PaginationMeta }>>(
      "/users/me/sessions",
      { params },
    );
    const result = unwrap(res);
    return { data: result.sessions, meta: result.meta };
  },

  revokeMySession: async (sessionId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/users/me/sessions/${sessionId}`,
    );
    return unwrap(res);
  },

  // ── Password ───────────────────────────────────────────────────────────────

  changePassword: async (payload: ChangePasswordDto): Promise<{ message: string }> => {
    const res = await apiClient.patch<ApiResponse<{ message: string }>>("/users/me/password", payload);
    return unwrap(res);
  },

  // ── Two-factor authentication ──────────────────────────────────────────────

  enableTwoFactor: async (payload?: TwoFactorCodeDto): Promise<EnableTwoFactorResponse> => {
    const res = await apiClient.post<ApiResponse<EnableTwoFactorResponse>>("/users/me/2fa/enable", payload ?? {});
    return unwrap(res);
  },

  disableTwoFactor: async (payload: TwoFactorCodeDto): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>("/users/me/2fa/disable", payload);
    return unwrap(res);
  },

  // ── Email verification ─────────────────────────────────────────────────────

  requestEmailVerification: async (
    payload: RequestEmailVerificationDto,
  ): Promise<RequestEmailVerificationResponse> => {
    const res = await apiClient.post<ApiResponse<RequestEmailVerificationResponse>>(
      "/users/me/email/verify",
      payload,
    );
    return unwrap(res);
  },

  confirmEmailVerification: async (payload: ConfirmEmailVerificationDto): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/users/me/email/verify/confirm",
      payload,
    );
    return unwrap(res);
  },
};