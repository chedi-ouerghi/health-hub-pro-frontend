export const authKeys = {
  me: ["auth", "me"] as const,
};

export const usersKeys = {
  me: ["users", "me"] as const,
  sessions: ["users", "me", "sessions"] as const,
};

export const specialtiesKeys = {
  all: ["specialties", "list"] as const,
};

export const referentialsKeys = {
  all: ["admin", "referentials"] as const,
  specialties: ["admin", "referentials", "specialties"] as const,
  languages: ["admin", "referentials", "languages"] as const,
  focusAreas: ["admin", "referentials", "focus-areas"] as const,
};

export const doctorsKeys = {
  all: ["doctors"] as const,
  lists: () => [...doctorsKeys.all, "list"] as const,
  list: (filters?: unknown) => [...doctorsKeys.lists(), filters ?? {}] as const,
  details: () => [...doctorsKeys.all, "detail"] as const,
  detail: (id: string) => [...doctorsKeys.details(), id] as const,
  availabilities: (id: string) => [...doctorsKeys.detail(id), "availabilities"] as const,
  reviews: (id: string, params?: unknown) =>
    [...doctorsKeys.detail(id), "reviews", params ?? {}] as const,
};

export const patientsKeys = {
  all: ["patients"] as const,
  me: ["patients", "me"] as const,
  detail: (id: string) => [...patientsKeys.all, "detail", id] as const,
  medications: (id: string) => [...patientsKeys.detail(id), "medications"] as const,
  vitals: (id: string) => [...patientsKeys.detail(id), "vitals"] as const,
};

export const appointmentsKeys = {
  all: ["appointments"] as const,
  lists: () => [...appointmentsKeys.all, "list"] as const,
  list: (filters?: unknown) => [...appointmentsKeys.lists(), filters ?? {}] as const,
  details: () => [...appointmentsKeys.all, "detail"] as const,
  detail: (id: string) => [...appointmentsKeys.details(), id] as const,
};

export const invoicesKeys = {
  all: ["invoices"] as const,
  lists: () => [...invoicesKeys.all, "list"] as const,
  list: (filters?: unknown) => [...invoicesKeys.lists(), filters ?? {}] as const,
  details: () => [...invoicesKeys.all, "detail"] as const,
  detail: (id: string) => [...invoicesKeys.details(), id] as const,
};

export const reviewsKeys = {
  all: ["reviews"] as const,
};

export const vitalsKeys = {
  all: ["vitals"] as const,
  me: ["vitals", "me"] as const,
};

export const medicationsKeys = {
  all: ["medications"] as const,
  me: ["medications", "me"] as const,
};

export const notificationsKeys = {
  all: ["notifications"] as const,
  me: ["notifications", "me"] as const,
};

export const activityLogsKeys = {
  all: ["activity-logs"] as const,
  me: ["activity-logs", "me"] as const,
};
