import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersKeys } from "../../lib/api/query-keys";
import { usersService } from "../../services/users.service";
import { useAuthStore } from "../../stores/auth-store";
import type {
    ChangePasswordDto,
    ConfirmEmailVerificationDto,
    RequestEmailVerificationDto,
    TwoFactorCodeDto,
} from "../../types/security.types";
import { useCurrentUserQuery } from "./use-auth";

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

export function useRequestEmailVerificationMutation() {
  return useMutation({
    mutationFn: (payload: RequestEmailVerificationDto) =>
      usersService.requestEmailVerification(payload),
  });
}

export function useConfirmEmailVerificationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ConfirmEmailVerificationDto) =>
      usersService.confirmEmailVerification(payload),
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