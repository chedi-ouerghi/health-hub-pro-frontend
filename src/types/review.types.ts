export interface ReviewPatientSummary {
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
}

export interface Review {
  id: string;
  patientId?: string;
  doctorId?: string;
  appointmentId?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
  patient?: ReviewPatientSummary;
}

export interface CreateReviewDto {
  appointmentId: string;
  rating: number;
  comment?: string;
}
