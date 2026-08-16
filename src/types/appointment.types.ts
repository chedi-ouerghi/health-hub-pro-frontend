export type AppointmentStatus = "UPCOMING" | "COMPLETED" | "CANCELLED" | "RESCHEDULED" | "NO_SHOW";

export interface AppointmentDoctorSummary {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  clinicName?: string;
  city?: string;
}

export interface AppointmentPatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
}

export interface AppointmentInvoiceSummary {
  id: string;
  invoiceNumber: string;
  status: string;
  amount: number | string;
  paidAt?: string | null;
}

export interface AppointmentReviewSummary {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId?: string;
  doctorId?: string;
  scheduledAt: string;
  durationMinutes: number;
  clinicAddressSnapshot: string;
  status: AppointmentStatus;
  price: number | string;
  currency: string;
  notes?: string | null;
  cancelReason?: string | null;
  createdAt: string;
  doctor?: AppointmentDoctorSummary;
  patient?: AppointmentPatientSummary;
  invoice?: AppointmentInvoiceSummary | null;
  review?: AppointmentReviewSummary | null;
}

export interface CreateAppointmentDto {
  doctorId: string;
  scheduledAt: string;
  notes?: string;
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  cardHolderName?: string;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
  cancelReason?: string;
}

export interface FilterAppointmentsDto {
  status?: AppointmentStatus;
  page?: number;
  limit?: number;
}
