export type DayOfWeek =
  "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export interface Specialty {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export interface Availability {
  id?: string;
  doctorId?: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotMinutes: number;
  isActive?: boolean;
}

export interface Education {
  id: string;
  school: string;
  degree: string;
  startYear: number;
  endYear?: number | null;
}

export interface Certificate {
  id: string;
  name: string;
  issuedBy?: string | null;
  issuedAt?: string | null;
}

export interface FocusArea {
  id: string;
  name: string;
}

export interface DoctorLanguage {
  id: string;
  name: string;
  code: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  specialtyId?: string;
  specialty?: Specialty;
  licenseNumber: string;
  isLicenseVerified?: boolean;
  yearsOfExperience?: number;
  bio?: string | null;
  consultationPrice: number | string;
  currency: string;
  clinicName: string;
  addressLine: string;
  city: string;
  country: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  ratingAverage: number | string;
  reviewCount: number;
  patientCount: number;
  recommendationRate: number | string;
  isAcceptingNewPatients: boolean;
  createdAt: string;
  educations?: Education[];
  certificates?: Certificate[];
  focusAreas?: { focusArea: FocusArea }[];
  languages?: { language: DoctorLanguage }[];
  availabilities?: Availability[];
}

export interface FilterDoctorsDto {
  specialtyId?: string;
  city?: string;
  availableToday?: boolean;
  isAcceptingNewPatients?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateAvailabilityDto {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotMinutes?: number;
}

export interface UpdateAvailabilityDto {
  startTime?: string;
  endTime?: string;
  slotMinutes?: number;
  isActive?: boolean;
}

export interface UpdateDoctorProfileDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
  consultationPrice?: string;
  clinicName?: string;
  addressLine?: string;
  city?: string;
  country?: string;
  isAcceptingNewPatients?: boolean;
  photoUrl?: string;
}
