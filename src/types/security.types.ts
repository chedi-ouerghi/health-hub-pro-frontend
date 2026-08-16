export type DeviceType = "DESKTOP" | "MOBILE" | "TABLET" | "UNKNOWN";

export interface UserSession {
  id: string;
  deviceName?: string | null;
  deviceType: DeviceType;
  ipAddress?: string | null;
  location?: string | null;
  userAgent?: string | null;
  isCurrent: boolean;
  lastActiveAt: string;
  expiresAt: string;
  createdAt: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface RequestPhoneVerificationDto {
  phone?: string;
}

export interface RequestPhoneVerificationResponse {
  message: string;
  devCode?: string;
}

export interface ConfirmPhoneVerificationDto {
  code: string;
}

export interface EnableTwoFactorResponse {
  message: string;
  secret: string;
  otpauthUrl: string;
  qrCodeUrl: string;
  pending?: boolean;
}

export interface TwoFactorCodeDto {
  code: string;
}

export interface UploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
}