import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { vitalsKeys } from "../../lib/api/query-keys";
import { vitalsService } from "../../services/vitals.service";
import { useAuthStore } from "../../stores/auth-store";
import type { CreateVitalRecordDto } from "../../types/vitals.types";

export function useVitalsQuery(limit = 50) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: vitalsKeys.me,
    queryFn: () => vitalsService.listMine(limit),
    enabled: Boolean(user),
  });
}

export function useCreateVitalRecordMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVitalRecordDto) => vitalsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vitalsKeys.all });
    },
  });
}
