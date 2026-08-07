import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type {
  CreateMedicationDto,
  CreateMedicationLogDto,
  Medication,
  MedicationLog,
  UpdateMedicationDto,
} from "../types/medication.types";

export const medicationsService = {
  listMine: async (): Promise<Medication[]> => {
    const res = await apiClient.get<ApiResponse<Medication[]>>("/medications/me");
    return unwrap(res);
  },

  create: async (payload: CreateMedicationDto): Promise<Medication> => {
    const res = await apiClient.post<ApiResponse<Medication>>("/medications", payload);
    return unwrap(res);
  },

  update: async (id: string, payload: UpdateMedicationDto): Promise<Medication> => {
    const res = await apiClient.patch<ApiResponse<Medication>>(`/medications/${id}`, payload);
    return unwrap(res);
  },

  delete: async (id: string): Promise<{ message: string }> => {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/medications/${id}`);
    return unwrap(res);
  },

  createLog: async (id: string, payload: CreateMedicationLogDto): Promise<MedicationLog> => {
    const res = await apiClient.post<ApiResponse<MedicationLog>>(
      `/medications/${id}/logs`,
      payload,
    );
    return unwrap(res);
  },
};
