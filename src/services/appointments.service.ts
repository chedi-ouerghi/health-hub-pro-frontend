import { apiClient, unwrap } from "../lib/api/client";
import { AppointmentSchema } from "../lib/api/validators";
import type { ApiResponse, PaginatedResponse, PaginationMeta } from "../types/api.types";
import type {
  Appointment,
  CreateAppointmentDto,
  FilterAppointmentsDto,
  UpdateAppointmentStatusDto,
} from "../types/appointment.types";

export const appointmentsService = {
  create: async (payload: CreateAppointmentDto): Promise<Appointment> => {
    const res = await apiClient.post<ApiResponse<Appointment>>("/appointments", payload);
    const data = unwrap(res);
    AppointmentSchema.parse(data);
    return data;
  },

  listMine: async (params?: FilterAppointmentsDto): Promise<PaginatedResponse<Appointment>> => {
    const res = await apiClient.get<
      ApiResponse<{ appointments: Appointment[]; meta: PaginationMeta }>
    >("/appointments/me", { params });
    const result = unwrap(res);
    return { data: result.appointments, meta: result.meta };
  },

  getById: async (id: string): Promise<Appointment> => {
    const res = await apiClient.get<ApiResponse<Appointment>>(`/appointments/${id}`);
    const data = unwrap(res);
    AppointmentSchema.parse(data);
    return data;
  },

  updateStatus: async (id: string, payload: UpdateAppointmentStatusDto): Promise<Appointment> => {
    const res = await apiClient.patch<ApiResponse<Appointment>>(
      `/appointments/${id}/status`,
      payload,
    );
    return unwrap(res);
  },

  cancel: async (id: string): Promise<Appointment> => {
    const res = await apiClient.delete<ApiResponse<Appointment>>(`/appointments/${id}`);
    return unwrap(res);
  },
};
