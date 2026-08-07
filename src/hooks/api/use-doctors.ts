import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { doctorsKeys, specialtiesKeys } from "../../lib/api/query-keys";
import { doctorsService } from "../../services/doctors.service";
import { specialtiesService } from "../../services/specialties.service";
import type {
  CreateAvailabilityDto,
  FilterDoctorsDto,
  UpdateAvailabilityDto,
  UpdateDoctorProfileDto,
} from "../../types/doctor.types";

export function useSpecialtiesQuery() {
  return useQuery({
    queryKey: specialtiesKeys.all,
    queryFn: () => specialtiesService.list(),
    staleTime: 300000, // 5 minutes
  });
}

export function useDoctorsQuery(filters?: FilterDoctorsDto, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: doctorsKeys.list(filters),
    queryFn: () => doctorsService.list(filters),
    enabled: options?.enabled ?? true,
  });
}

export function useDoctorQuery(id: string) {
  return useQuery({
    queryKey: doctorsKeys.detail(id),
    queryFn: () => doctorsService.getById(id),
    enabled: Boolean(id),
  });
}

export function useDoctorAvailabilitiesQuery(id: string) {
  return useQuery({
    queryKey: doctorsKeys.availabilities(id),
    queryFn: () => doctorsService.getAvailabilities(id),
    enabled: Boolean(id),
  });
}

export function useDoctorReviewsQuery(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: doctorsKeys.reviews(id, params),
    queryFn: () => doctorsService.getReviews(id, params),
    enabled: Boolean(id),
  });
}

export function useUpdateDoctorProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateDoctorProfileDto) => doctorsService.updateMe(payload),
    onSuccess: (updatedDoctor) => {
      queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
      if (updatedDoctor.id) {
        queryClient.invalidateQueries({
          queryKey: doctorsKeys.detail(updatedDoctor.id),
        });
      }
    },
  });
}

export function useCreateAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAvailabilityDto) => doctorsService.createAvailability(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
    },
  });
}

export function useUpdateAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ availId, payload }: { availId: string; payload: UpdateAvailabilityDto }) =>
      doctorsService.updateAvailability(availId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
    },
  });
}

export function useDeleteAvailabilityMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (availId: string) => doctorsService.deleteAvailability(availId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: doctorsKeys.all });
    },
  });
}
