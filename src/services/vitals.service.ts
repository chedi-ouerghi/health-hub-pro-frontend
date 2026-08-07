import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type { CreateVitalRecordDto, VitalRecord } from "../types/vitals.types";

export const vitalsService = {
  listMine: async (limit = 50): Promise<VitalRecord[]> => {
    const res = await apiClient.get<ApiResponse<VitalRecord[]>>("/vitals/me", {
      params: { limit },
    });
    return unwrap(res);
  },

  create: async (payload: CreateVitalRecordDto): Promise<VitalRecord> => {
    const res = await apiClient.post<ApiResponse<VitalRecord>>("/vitals", payload);
    return unwrap(res);
  },
};
