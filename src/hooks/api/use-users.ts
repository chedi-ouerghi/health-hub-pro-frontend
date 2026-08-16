import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersKeys } from "../../lib/api/query-keys";
import { usersService } from "../../services/users.service";
import { useAuthStore } from "../../stores/auth-store";
import { useCurrentUserQuery } from "./use-auth";
import type {
  ChangePasswordDto,
  RequestPhoneVerificationDto,
  ConfirmPhoneVerificationDto,
  TwoFactorCodeDto,
} from "../../types/security.types";

export function useMySessionsQuery(params?: { page?: number; limit?: number }) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: [...usersKeys.sessions, params ?? {}],
    queryFn: () => usersService.getMySessions(params),
    enabled: Boolean(user),
  });
}

export function useRevokeMySessionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sessionId: string) => usersService.revokeMySession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.sessions });
    },
  });
}

export function useChangePasswordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ChangePasswordDto) => usersService.changePassword(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.sessions });
      queryClient.invalidateQueries({ queryKey: usersKeys.me });
    },
  });
}

export function useEnableTwoFactorMutation() {
  return useMutation({
    mutationFn: (payload?: TwoFactorCodeDto) => usersService.enableTwoFactor(payload),
  });
}

export function useDisableTwoFactorMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: TwoFactorCodeDto) => usersService.disableTwoFactor(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.me });
    },
  });
}

export function useRequestPhoneVerificationMutation() {
  return useMutation({
    mutationFn: (payload: RequestPhoneVerificationDto) =>
      usersService.requestPhoneVerification(payload),
  });
}

export function useConfirmPhoneVerificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmPhoneVerificationDto) =>
      usersService.confirmPhoneVerification(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.me });
    },
  });
}

export function useAvatarUploadOnSuccess() {
  const queryClient = useQueryClient();
  const { refetch } = useCurrentUserQuery();

  return {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.me });
      void refetch();
    },
  };
}