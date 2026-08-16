import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { appointmentsKeys, doctorsKeys, invoicesKeys } from "../../lib/api/query-keys";
import { appointmentsService } from "../../services/appointments.service";
import { useAuthStore } from "../../stores/auth-store";
import type {
  CreateAppointmentDto,
  FilterAppointmentsDto,
  UpdateAppointmentStatusDto,
  RescheduleAppointmentDto,
} from "../../types/appointment.types";

export function useAppointmentsQuery(filters?: FilterAppointmentsDto) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: appointmentsKeys.list(filters),
    queryFn: () => appointmentsService.listMine(filters),
    enabled: Boolean(user),
  });
}

export function useAppointmentQuery(id: string) {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: appointmentsKeys.detail(id),
    queryFn: () => appointmentsService.getById(id),
    enabled: Boolean(id) && Boolean(user),
  });
}

export function useCreateAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAppointmentDto) => appointmentsService.create(payload),
    onSuccess: (newAppointment) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      if (newAppointment.doctorId) {
        queryClient.invalidateQueries({
          queryKey: doctorsKeys.availabilities(newAppointment.doctorId),
        });
      }
    },
  });
}

export function useUpdateAppointmentStatusMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAppointmentStatusDto }) =>
      appointmentsService.updateStatus(id, payload),
    onSuccess: (updatedAppt) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      queryClient.invalidateQueries({ queryKey: invoicesKeys.all });
      if (updatedAppt.id) {
        queryClient.invalidateQueries({
          queryKey: appointmentsKeys.detail(updatedAppt.id),
        });
      }
    },
  });
}

export function useCancelAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentsService.cancel(id),
    onSuccess: (cancelledAppt) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      if (cancelledAppt.id) {
        queryClient.invalidateQueries({
          queryKey: appointmentsKeys.detail(cancelledAppt.id),
        });
      }
    },
  });
}

export function useRescheduleAppointmentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleAppointmentDto }) =>
      appointmentsService.reschedule(id, payload),
    onSuccess: (rescheduledAppt) => {
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      if (rescheduledAppt.id) {
        queryClient.invalidateQueries({
          queryKey: appointmentsKeys.detail(rescheduledAppt.id),
        });
      }
    },
  });
}
