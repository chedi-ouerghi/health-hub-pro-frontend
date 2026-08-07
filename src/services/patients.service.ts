import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type { Patient, UpdatePatientProfileDto } from "../types/patient.types";
import type { CreateMedicationDto, Medication } from "../types/medication.types";
import type { CreateVitalRecordDto, VitalRecord } from "../types/vitals.types";

export const patientsService = {
  getMe: async (): Promise<Patient> => {
    const res = await apiClient.get<ApiResponse<Patient>>("/patients/me");
    return unwrap(res);
  },

  updateMe: async (payload: UpdatePatientProfileDto): Promise<Patient> => {
    const res = await apiClient.patch<ApiResponse<Patient>>("/patients/me", payload);
    return unwrap(res);
  },

  getById: async (id: string): Promise<Patient> => {
    const res = await apiClient.get<ApiResponse<Patient>>(`/patients/${id}`);
    return unwrap(res);
  },

  listPatientMedications: async (patientId: string): Promise<Medication[]> => {
    const res = await apiClient.get<ApiResponse<Medication[]>>(
      `/patients/${patientId}/medications`,
    );
    return unwrap(res);
  },

  createPatientMedication: async (
    patientId: string,
    payload: CreateMedicationDto,
  ): Promise<Medication> => {
    const res = await apiClient.post<ApiResponse<Medication>>(
      `/patients/${patientId}/medications`,
      payload,
    );
    return unwrap(res);
  },

  listPatientVitals: async (patientId: string): Promise<VitalRecord[]> => {
    const res = await apiClient.get<ApiResponse<VitalRecord[]>>(`/patients/${patientId}/vitals`);
    return unwrap(res);
  },

  createPatientVital: async (
    patientId: string,
    payload: CreateVitalRecordDto,
  ): Promise<VitalRecord> => {
    const res = await apiClient.post<ApiResponse<VitalRecord>>(
      `/patients/${patientId}/vitals`,
      payload,
    );
    return unwrap(res);
  },
};
