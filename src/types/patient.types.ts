export type Gender = "MALE" | "FEMALE" | "OTHER" | "UNDISCLOSED";

export type BloodType =
  "A_POS" | "A_NEG" | "B_POS" | "B_NEG" | "AB_POS" | "AB_NEG" | "O_POS" | "O_NEG" | "UNKNOWN";

export interface Patient {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: Gender | null;
  bloodType?: BloodType;
  addressLine?: string | null;
  city?: string | null;
  country?: string | null;
  membershipPlan?: string;
  memberSince?: string;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  user?: {
    email?: string;
    phone?: string | null;
    status?: string;
  } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdatePatientProfileDto {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: Gender;
  bloodType?: BloodType;
  addressLine?: string;
  city?: string;
  country?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  photoUrl?: string;
}
