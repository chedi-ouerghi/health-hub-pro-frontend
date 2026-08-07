export type MedicationLogStatus = "TAKEN" | "MISSED" | "SKIPPED";

export interface MedicationLog {
  id: string;
  medicationId: string;
  status: MedicationLogStatus;
  loggedAt: string;
}

export interface PrescribingDoctorSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  scheduledTime: string;
  isActive: boolean;
  prescribedByDoctorId?: string | null;
  prescribedByDoctor?: PrescribingDoctorSummary | null;
  createdAt: string;
  updatedAt: string;
  logs?: MedicationLog[];
}

export interface CreateMedicationDto {
  name: string;
  dose: string;
  scheduledTime: string;
}

export interface UpdateMedicationDto {
  name?: string;
  dose?: string;
  scheduledTime?: string;
  isActive?: boolean;
}

export interface CreateMedicationLogDto {
  status: MedicationLogStatus;
}
