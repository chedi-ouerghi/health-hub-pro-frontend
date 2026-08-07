import { apiClient, unwrap } from "../lib/api/client";
import { UserSchema } from "../lib/api/validators";
import type { ApiResponse } from "../types/api.types";
import type { User } from "../types/auth.types";
import type { Doctor, UpdateDoctorProfileDto } from "../types/doctor.types";
import type { Patient, UpdatePatientProfileDto } from "../types/patient.types";

export const usersService = {
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>("/users/me");
    const data = unwrap(res);
    UserSchema.parse(data);
    return data;
  },

  updateMe: async (
    payload: UpdatePatientProfileDto | UpdateDoctorProfileDto,
  ): Promise<Patient | Doctor> => {
    const res = await apiClient.patch<ApiResponse<Patient | Doctor>>("/users/me", payload);
    return unwrap(res);
  },
};
