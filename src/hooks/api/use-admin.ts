import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { referentialsKeys } from "../../lib/api/query-keys";
import { adminService } from "../../services/admin.service";
import type { Specialty, FocusArea, DoctorLanguage } from "../../types/doctor.types";
import type {
  AdminSpecialtyDto,
  AdminLanguageDto,
  AdminFocusAreaDto,
} from "../../types/admin.types";

export function useReferentialsQuery() {
  return useQuery({
    queryKey: referentialsKeys.all,
    queryFn: async () => {
      const [specialties, languages, focusAreas] = await Promise.all([
        adminService.specialties.list(),
        adminService.languages.list(),
        adminService.focusAreas.list(),
      ]);
      return { specialties, languages, focusAreas };
    },
  });
}

export function useCreateSpecialtyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminSpecialtyDto) => adminService.specialties.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useUpdateSpecialtyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminSpecialtyDto> }) =>
      adminService.specialties.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useDeleteSpecialtyMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.specialties.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useCreateLanguageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminLanguageDto) => adminService.languages.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useUpdateLanguageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminLanguageDto> }) =>
      adminService.languages.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useDeleteLanguageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.languages.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useCreateFocusAreaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AdminFocusAreaDto) => adminService.focusAreas.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useUpdateFocusAreaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<AdminFocusAreaDto> }) =>
      adminService.focusAreas.update(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export function useDeleteFocusAreaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.focusAreas.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: referentialsKeys.all }),
  });
}

export type { Specialty, FocusArea, DoctorLanguage };