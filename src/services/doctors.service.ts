import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "../types/api.types";
import type {
  Availability,
  CreateAvailabilityDto,
  Doctor,
  FilterDoctorsDto,
  UpdateAvailabilityDto,
  UpdateDoctorProfileDto,
} from "../types/doctor.types";
import type { Review } from "../types/review.types";

export const doctorsService = {
  list: async (params?: FilterDoctorsDto): Promise<PaginatedResponse<Doctor>> => {
    const res = await apiClient.get<ApiResponse<{ doctors: Doctor[]; meta: PaginationMeta }>>(
      "/doctors",
      { params },
    );
    const result = unwrap(res);
    return { data: result.doctors, meta: result.meta };
  },

  getById: async (id: string): Promise<Doctor> => {
    const res = await apiClient.get<ApiResponse<Doctor>>(`/doctors/${id}`);
    return unwrap(res);
  },

  getAvailabilities: async (id: string): Promise<Availability[]> => {
    const res = await apiClient.get<ApiResponse<Availability[]>>(`/doctors/${id}/availabilities`);
    return unwrap(res);
  },

  getReviews: async (
    id: string,
    params?: { page?: number; limit?: number },
  ): Promise<PaginatedResponse<Review>> => {
    const res = await apiClient.get<ApiResponse<{ reviews: Review[]; meta: PaginationMeta }>>(
      `/doctors/${id}/reviews`,
      { params },
    );
    const result = unwrap(res);
    return { data: result.reviews, meta: result.meta };
  },

  updateMe: async (payload: UpdateDoctorProfileDto): Promise<Doctor> => {
    const res = await apiClient.patch<ApiResponse<Doctor>>("/doctors/me", payload);
    return unwrap(res);
  },

  createAvailability: async (payload: CreateAvailabilityDto): Promise<Availability> => {
    const res = await apiClient.post<ApiResponse<Availability>>(
      "/doctors/me/availabilities",
      payload,
    );
    return unwrap(res);
  },

  updateAvailability: async (
    availId: string,
    payload: UpdateAvailabilityDto,
  ): Promise<Availability> => {
    const res = await apiClient.patch<ApiResponse<Availability>>(
      `/doctors/me/availabilities/${availId}`,
      payload,
    );
    return unwrap(res);
  },

  deleteAvailability: async (availId: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(
      `/doctors/me/availabilities/${availId}`,
    );
    return unwrap(res);
  },
};
