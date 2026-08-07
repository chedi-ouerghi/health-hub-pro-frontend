import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usersKeys } from "../../lib/api/query-keys";
import { authService } from "../../services/auth.service";
import { usersService } from "../../services/users.service";
import { useAuthStore } from "../../stores/auth-store";
import type {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from "../../types/auth.types";

export function useLoginMutation() {
  const setTokens = useAuthStore((s) => s.setTokens);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: LoginDto) => authService.login(dto),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken);
      queryClient.invalidateQueries({ queryKey: usersKeys.me });
    },
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: (dto: RegisterDto) => authService.register(dto),
  });
}

export function useLogoutMutation() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(refreshToken ? { refreshToken } : undefined),
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
    onError: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

export function useCurrentUserQuery() {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: usersKeys.me,
    queryFn: async () => {
      const user = await usersService.getMe();
      setUser(user);
      return user;
    },
    staleTime: 60000,
    retry: false,
  });
}

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: (dto: ForgotPasswordDto) => authService.forgotPassword(dto),
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: (dto: ResetPasswordDto) => authService.resetPassword(dto),
  });
}
