export interface RecordingDoctorSummary {
  id: string;
  firstName: string;
  lastName: string;
}

export interface VitalRecord {
  id: string;
  patientId: string;
  recordedAt: string;
  heartRate: number | null;
  systolic: number | null;
  diastolic: number | null;
  sleepHours: number | null;
  steps: number | null;
  recordedByDoctorId?: string | null;
  recordedByDoctor?: RecordingDoctorSummary | null;
}

export interface CreateVitalRecordDto {
  heartRate?: number;
  systolic?: number;
  diastolic?: number;
  sleepHours?: number;
  steps?: number;
}
