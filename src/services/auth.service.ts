import { apiClient, unwrap } from "../lib/api/client";
import { AuthResponseSchema } from "../lib/api/validators";
import type { ApiResponse } from "../types/api.types";
import type {
  AuthResponse,
  ForgotPasswordDto,
  LoginDto,
  LogoutDto,
  RefreshTokenDto,
  RegisterDto,
  RegisterResponse,
  ResetPasswordDto,
  VerifyEmailDto,
} from "../types/auth.types";

export const authService = {
  register: async (payload: RegisterDto): Promise<RegisterResponse> => {
    const res = await apiClient.post<ApiResponse<RegisterResponse>>("/auth/register", payload);
    return unwrap(res);
  },

  login: async (payload: LoginDto): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/login", payload);
    const data = unwrap(res);
    AuthResponseSchema.parse(data);
    return data;
  },

  refresh: async (payload: RefreshTokenDto): Promise<AuthResponse> => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>("/auth/refresh", payload);
    return unwrap(res);
  },

  logout: async (payload?: LogoutDto): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/logout",
      payload ?? {},
    );
    return unwrap(res);
  },

  verifyEmail: async (payload: VerifyEmailDto): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/verify-email",
      payload,
    );
    return unwrap(res);
  },

  forgotPassword: async (payload: ForgotPasswordDto): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/forgot-password",
      payload,
    );
    return unwrap(res);
  },

  resetPassword: async (payload: ResetPasswordDto): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>(
      "/auth/reset-password",
      payload,
    );
    return unwrap(res);
  },
};
