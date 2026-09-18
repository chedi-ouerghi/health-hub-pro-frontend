import type { Doctor } from "./doctor.types";
import type { Patient } from "./patient.types";

export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN" | "SUPER_ADMIN";

export type UserStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED" | "DEACTIVATED";

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  emailVerifiedAt?: string | null;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  patient?: Patient | null;
  doctor?: Doctor | null;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  licenseNumber?: string;
  specialtyId?: string;
  clinicName?: string;
  addressLine?: string;
  city?: string;
  country?: string;
  consultationPrice?: string;
  cfTurnstileToken?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface RegisterResponse {
  message: string;
  userId: string;
  verificationToken?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface VerifyEmailDto {
  token: string;
}

export interface ResendVerificationDto {
  email: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface LogoutDto {
  refreshToken?: string;
}
