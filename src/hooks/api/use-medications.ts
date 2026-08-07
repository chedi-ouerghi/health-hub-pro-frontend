import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { medicationsKeys } from "../../lib/api/query-keys";
import { medicationsService } from "../../services/medications.service";
import { useAuthStore } from "../../stores/auth-store";
import type { CreateMedicationDto, UpdateMedicationDto } from "../../types/medication.types";

export function useMedicationsQuery() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: medicationsKeys.me,
    queryFn: () => medicationsService.listMine(),
    enabled: Boolean(user),
  });
}

export function useCreateMedicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMedicationDto) => medicationsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicationsKeys.all });
    },
  });
}

export function useUpdateMedicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateMedicationDto }) =>
      medicationsService.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicationsKeys.all });
    },
  });
}

export function useDeleteMedicationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => medicationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicationsKeys.all });
    },
  });
}
