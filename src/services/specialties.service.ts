import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type { Specialty } from "../types/doctor.types";

export const specialtiesService = {
  list: async (): Promise<Specialty[]> => {
    const res = await apiClient.get<ApiResponse<Specialty[]>>("/specialties");
    return unwrap(res);
  },
};
