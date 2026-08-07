import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patientsKeys, activityLogsKeys } from "../../lib/api/query-keys";
import { patientsService } from "../../services/patients.service";
import { useAuthStore } from "../../stores/auth-store";
import type { UpdatePatientProfileDto } from "../../types/patient.types";
import type { CreateMedicationDto } from "../../types/medication.types";
import type { CreateVitalRecordDto } from "../../types/vitals.types";

export function usePatientMeQuery() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: patientsKeys.me,
    queryFn: () => patientsService.getMe(),
    enabled: Boolean(user),
  });
}

export function usePatientQuery(id: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: patientsKeys.detail(id),
    queryFn: () => patientsService.getById(id),
    enabled: Boolean(id) && Boolean(user),
  });
}

export function useUpdatePatientProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePatientProfileDto) => patientsService.updateMe(payload),
    onSuccess: (updatedPatient) => {
      queryClient.invalidateQueries({ queryKey: patientsKeys.me });
      if (updatedPatient.id) {
        queryClient.invalidateQueries({
          queryKey: patientsKeys.detail(updatedPatient.id),
        });
      }
    },
  });
}

export function usePatientMedicationsQuery(patientId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: patientsKeys.medications(patientId),
    queryFn: () => patientsService.listPatientMedications(patientId),
    enabled: Boolean(patientId) && Boolean(user),
  });
}

export function useCreatePatientMedicationMutation(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateMedicationDto) =>
      patientsService.createPatientMedication(patientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientsKeys.medications(patientId) });
      queryClient.invalidateQueries({ queryKey: activityLogsKeys.all });
    },
  });
}

export function usePatientVitalsQuery(patientId: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: patientsKeys.vitals(patientId),
    queryFn: () => patientsService.listPatientVitals(patientId),
    enabled: Boolean(patientId) && Boolean(user),
  });
}

export function useCreatePatientVitalMutation(patientId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVitalRecordDto) =>
      patientsService.createPatientVital(patientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientsKeys.vitals(patientId) });
      queryClient.invalidateQueries({ queryKey: activityLogsKeys.all });
    },
  });
}
