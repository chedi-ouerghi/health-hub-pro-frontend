import doctor1 from "@/assets/doctor-1.jpg";
import doctor2 from "@/assets/doctor-2.jpg";
import doctor3 from "@/assets/doctor-3.jpg";
import doctor4 from "@/assets/doctor-4.jpg";
import doctor5 from "@/assets/doctor-5.jpg";
import doctor6 from "@/assets/doctor-6.jpg";
import patientPhoto from "@/assets/patient.jpg";

export type ConsultationType = "video" | "clinic" | "home";

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  photo: string;
  rating: number;
  reviewCount: number;
  experience: number;
  languages: string[];
  price: number;
  availableToday: boolean;
  nextSlot: string;
  videoConsultation: boolean;
  consultationTypes: ConsultationType[];
  location: string;
  patients: number;
  recommendation: number;
  license: string;
  bio: string;
  education: { school: string; degree: string; years: string }[];
  certificates: string[];
  focus: string[];
  reviews: Review[];
}

export const patient = {
  name: "John Doe",
  firstName: "John",
  email: "john.doe@medicare.io",
  phone: "+1 (415) 220-8891",
  photo: patientPhoto,
  memberSince: "March 2021",
  plan: "Premium Care",
  bloodType: "O+",
  address: "1180 Sansome Street, San Francisco, CA 94111",
  emergencyContact: { name: "Emma Doe", relation: "Spouse", phone: "+1 (415) 220-3312" },
};

const REVIEW_RATINGS = [5, 5, 4, 5] as const;
const REVIEW_DATES = ["2 days ago", "1 week ago", "3 weeks ago", "2 months ago"] as const;
const REVIEW_COMMENTS = [
  "Extremely attentive and took the time to explain everything clearly. Best consultation I have had.",
  "Very professional, punctual and empathetic. The video call quality was excellent.",
  "Great experience overall. Follow-up plan was detailed and easy to follow.",
  "Answered all of my questions with patience. I felt genuinely cared for.",
] as const;

const baseReviews = (names: string[]): Review[] =>
  names.map((author, index) => ({
    id: `rev-${index}-${author}`,
    author,
    rating: REVIEW_RATINGS[index % 4] ?? 5,
    date: REVIEW_DATES[index % 4] ?? "recently",
    comment: REVIEW_COMMENTS[index % 4] ?? "Great experience.",
  }));

export const doctors: Doctor[] = [
  {
    id: "tracey-clifford",
    name: "Dr. Tracey Clifford",
    specialty: "Neurology",
    photo: doctor1,
    rating: 4.9,
    reviewCount: 2743,
    experience: 10,
    languages: ["English", "French", "Arabic"],
    price: 35,
    availableToday: true,
    nextSlot: "Today · 10:30 AM",
    videoConsultation: true,
    consultationTypes: ["video", "clinic", "home"],
    location: "Pacific Neuro Center, San Francisco",
    patients: 3200,
    recommendation: 98,
    license: "MED1234567",
    bio: "Dr. Tracey Clifford is a board-certified neurologist with over 10 years of experience diagnosing and treating disorders of the brain, spinal cord and nervous system. She specializes in headaches, migraines, stroke management and neurodegenerative diseases.",
    education: [
      { school: "Harvard Medical School", degree: "MD in Neurology", years: "2010 — 2014" },
      {
        school: "Johns Hopkins University",
        degree: "Residency in Neurology",
        years: "2014 — 2017",
      },
    ],
    certificates: [
      "American Board of Neurology",
      "Certified in Stroke Care",
      "Neurocritical Care Society",
    ],
    focus: ["Neurology", "Headache & Migraine", "Stroke", "Parkinson's Disease", "Epilepsy"],
    reviews: baseReviews(["Marta Vinke", "Leo Grant", "Amelia Rhodes", "Kevin Park"]),
  },
  {
    id: "daniel-moreau",
    name: "Dr. Daniel Moreau",
    specialty: "Cardiology",
    photo: doctor2,
    rating: 4.8,
    reviewCount: 1890,
    experience: 16,
    languages: ["English", "French"],
    price: 48,
    availableToday: true,
    nextSlot: "Today · 02:00 PM",
    videoConsultation: true,
    consultationTypes: ["video", "clinic"],
    location: "Bay Heart Institute, San Francisco",
    patients: 5100,
    recommendation: 96,
    license: "MED8891233",
    bio: "Dr. Daniel Moreau is an interventional cardiologist focused on preventive cardiology, arrhythmia management and post-operative heart care. He has performed more than 1,800 catheter procedures.",
    education: [
      { school: "Stanford University", degree: "MD in Cardiology", years: "2004 — 2008" },
      {
        school: "Mayo Clinic",
        degree: "Fellowship, Interventional Cardiology",
        years: "2008 — 2012",
      },
    ],
    certificates: ["American Board of Cardiology", "Advanced Cardiac Life Support", "ESC Member"],
    focus: ["Cardiology", "Hypertension", "Arrhythmia", "Preventive Care"],
    reviews: baseReviews(["Sofia Lang", "Hugo Bennett", "Diane Wu", "Peter Zhao"]),
  },
  {
    id: "amara-okafor",
    name: "Dr. Amara Okafor",
    specialty: "Dermatology",
    photo: doctor3,
    rating: 4.9,
    reviewCount: 3120,
    experience: 12,
    languages: ["English", "Spanish"],
    price: 40,
    availableToday: false,
    nextSlot: "Tomorrow · 09:00 AM",
    videoConsultation: true,
    consultationTypes: ["video", "clinic"],
    location: "Golden Gate Skin Clinic",
    patients: 4400,
    recommendation: 99,
    license: "MED4451190",
    bio: "Dr. Amara Okafor is a dermatologist specializing in medical and cosmetic dermatology, chronic acne, eczema and skin cancer screening with a strong focus on skin of color.",
    education: [
      { school: "Yale School of Medicine", degree: "MD in Dermatology", years: "2008 — 2012" },
      { school: "NYU Langone", degree: "Residency in Dermatology", years: "2012 — 2015" },
    ],
    certificates: [
      "American Board of Dermatology",
      "Skin Cancer Foundation",
      "Laser Safety Certified",
    ],
    focus: ["Dermatology", "Acne", "Eczema", "Skin Cancer Screening"],
    reviews: baseReviews(["Nora Klein", "Ivan Petrov", "Grace Miller", "Tom Hale"]),
  },
  {
    id: "kenji-tanaka",
    name: "Dr. Kenji Tanaka",
    specialty: "General Medicine",
    photo: doctor4,
    rating: 4.7,
    reviewCount: 980,
    experience: 6,
    languages: ["English", "Japanese"],
    price: 28,
    availableToday: true,
    nextSlot: "Today · 11:30 AM",
    videoConsultation: true,
    consultationTypes: ["video", "clinic", "home"],
    location: "Sunset Family Practice",
    patients: 2100,
    recommendation: 94,
    license: "MED7712045",
    bio: "Dr. Kenji Tanaka is a general practitioner providing whole-family primary care, chronic condition management and same-day telemedicine consultations.",
    education: [
      { school: "University of Tokyo", degree: "MD, General Medicine", years: "2014 — 2018" },
      { school: "UCSF", degree: "Residency in Family Medicine", years: "2018 — 2020" },
    ],
    certificates: ["Board Certified Family Medicine", "Telemedicine Practitioner"],
    focus: ["General Medicine", "Preventive Care", "Diabetes", "Vaccination"],
    reviews: baseReviews(["Alice Roy", "Marc Dubois", "Lena Fischer", "Omar Said"]),
  },
  {
    id: "victor-almeida",
    name: "Dr. Victor Almeida",
    specialty: "Orthopedics",
    photo: doctor5,
    rating: 4.6,
    reviewCount: 1430,
    experience: 21,
    languages: ["English", "Portuguese", "Spanish"],
    price: 55,
    availableToday: false,
    nextSlot: "Thu · 03:30 PM",
    videoConsultation: false,
    consultationTypes: ["clinic"],
    location: "Presidio Orthopedic Center",
    patients: 6700,
    recommendation: 93,
    license: "MED3320981",
    bio: "Dr. Victor Almeida is an orthopedic surgeon with two decades of experience in sports injuries, joint replacement and spine rehabilitation programs.",
    education: [
      { school: "University of São Paulo", degree: "MD, Orthopedic Surgery", years: "1999 — 2004" },
      {
        school: "Hospital for Special Surgery",
        degree: "Fellowship, Sports Medicine",
        years: "2004 — 2007",
      },
    ],
    certificates: ["American Board of Orthopaedic Surgery", "Sports Medicine Fellowship"],
    focus: ["Orthopedics", "Sports Injury", "Joint Replacement", "Spine"],
    reviews: baseReviews(["Julia Braun", "Sam Ortiz", "Ken Adams", "Rita Volk"]),
  },
  {
    id: "priya-raman",
    name: "Dr. Priya Raman",
    specialty: "Pediatrics",
    photo: doctor6,
    rating: 5.0,
    reviewCount: 2210,
    experience: 9,
    languages: ["English", "Hindi", "Tamil"],
    price: 32,
    availableToday: true,
    nextSlot: "Today · 04:15 PM",
    videoConsultation: true,
    consultationTypes: ["video", "home"],
    location: "Mission Children's Health",
    patients: 3800,
    recommendation: 100,
    license: "MED5590142",
    bio: "Dr. Priya Raman is a pediatrician devoted to newborn care, childhood development milestones and family-centered preventive medicine.",
    education: [
      { school: "AIIMS New Delhi", degree: "MD in Pediatrics", years: "2011 — 2015" },
      {
        school: "Boston Children's Hospital",
        degree: "Fellowship, Neonatology",
        years: "2015 — 2018",
      },
    ],
    certificates: ["American Board of Pediatrics", "Neonatal Resuscitation Program"],
    focus: ["Pediatrics", "Newborn Care", "Allergies", "Child Development"],
    reviews: baseReviews(["Hannah Cole", "Yusuf Demir", "Clara Novak", "Ben Silva"]),
  },
];

export const specialties = [
  "All",
  "Neurology",
  "Cardiology",
  "Dermatology",
  "General Medicine",
  "Orthopedics",
  "Pediatrics",
];

export const timeSlots = [
  "08:30 AM",
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
];

export type AppointmentStatus = "upcoming" | "completed" | "cancelled" | "rescheduled";

export interface Appointment {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  photo: string;
  date: string;
  time: string;
  type: ConsultationType;
  status: AppointmentStatus;
  price: number;
  notes: string;
  invoice: string;
}

export const appointments: Appointment[] = [
  {
    id: "APT-2481",
    doctorId: "tracey-clifford",
    doctorName: "Dr. Tracey Clifford",
    specialty: "Neurology",
    photo: doctor1,
    date: "2026-08-05",
    time: "10:30 AM",
    type: "video",
    status: "upcoming",
    price: 35,
    notes: "Follow-up on migraine treatment plan and review of the new medication response.",
    invoice: "INV-2481",
  },
  {
    id: "APT-2470",
    doctorId: "kenji-tanaka",
    doctorName: "Dr. Kenji Tanaka",
    specialty: "General Medicine",
    photo: doctor4,
    date: "2026-08-11",
    time: "11:30 AM",
    type: "clinic",
    status: "upcoming",
    price: 28,
    notes: "Annual physical examination including blood panel and vitals review.",
    invoice: "INV-2470",
  },
  {
    id: "APT-2402",
    doctorId: "daniel-moreau",
    doctorName: "Dr. Daniel Moreau",
    specialty: "Cardiology",
    photo: doctor2,
    date: "2026-07-18",
    time: "02:00 PM",
    type: "video",
    status: "completed",
    price: 48,
    notes: "Blood pressure well controlled. Continue current dosage, recheck in three months.",
    invoice: "INV-2402",
  },
  {
    id: "APT-2377",
    doctorId: "amara-okafor",
    doctorName: "Dr. Amara Okafor",
    specialty: "Dermatology",
    photo: doctor3,
    date: "2026-07-02",
    time: "09:00 AM",
    type: "clinic",
    status: "completed",
    price: 40,
    notes: "Annual mole mapping completed. No suspicious lesions detected.",
    invoice: "INV-2377",
  },
  {
    id: "APT-2341",
    doctorId: "victor-almeida",
    doctorName: "Dr. Victor Almeida",
    specialty: "Orthopedics",
    photo: doctor5,
    date: "2026-06-21",
    time: "03:30 PM",
    type: "clinic",
    status: "cancelled",
    price: 55,
    notes: "Cancelled by patient — rescheduled to a later date due to travel.",
    invoice: "INV-2341",
  },
  {
    id: "APT-2318",
    doctorId: "priya-raman",
    doctorName: "Dr. Priya Raman",
    specialty: "Pediatrics",
    photo: doctor6,
    date: "2026-06-09",
    time: "04:15 PM",
    type: "home",
    status: "rescheduled",
    price: 32,
    notes: "Moved from 09 June to 16 June at the patient's request.",
    invoice: "INV-2318",
  },
  {
    id: "APT-2290",
    doctorId: "tracey-clifford",
    doctorName: "Dr. Tracey Clifford",
    specialty: "Neurology",
    photo: doctor1,
    date: "2026-05-27",
    time: "10:00 AM",
    type: "video",
    status: "completed",
    price: 35,
    notes: "Initial consultation. Migraine diary started, triggers identified.",
    invoice: "INV-2290",
  },
  {
    id: "APT-2255",
    doctorId: "kenji-tanaka",
    doctorName: "Dr. Kenji Tanaka",
    specialty: "General Medicine",
    photo: doctor4,
    date: "2026-05-04",
    time: "12:00 PM",
    type: "video",
    status: "completed",
    price: 28,
    notes: "Seasonal allergy management, antihistamine prescribed for six weeks.",
    invoice: "INV-2255",
  },
  {
    id: "APT-2199",
    doctorId: "daniel-moreau",
    doctorName: "Dr. Daniel Moreau",
    specialty: "Cardiology",
    photo: doctor2,
    date: "2026-04-14",
    time: "02:30 PM",
    type: "clinic",
    status: "cancelled",
    price: 48,
    notes: "Cancelled by clinic — doctor unavailable, no charge applied.",
    invoice: "INV-2199",
  },
];

export const healthMetrics = [
  { label: "Heart Rate", value: 72, unit: "bpm", delta: -2.4, status: "Normal", icon: "heart" },
  {
    label: "Blood Pressure",
    value: 118,
    unit: "/78",
    delta: 1.1,
    status: "Optimal",
    icon: "activity",
  },
  { label: "Sleep", value: 7.4, unit: "hrs", delta: 4.6, status: "Good", icon: "moon" },
  {
    label: "Steps",
    value: 8420,
    unit: "today",
    delta: 12.3,
    status: "On track",
    icon: "footprints",
  },
];

export const vitalsTrend = [
  { month: "Feb", heartRate: 76, systolic: 124, sleep: 6.4 },
  { month: "Mar", heartRate: 75, systolic: 122, sleep: 6.8 },
  { month: "Apr", heartRate: 74, systolic: 121, sleep: 7.0 },
  { month: "May", heartRate: 73, systolic: 120, sleep: 6.9 },
  { month: "Jun", heartRate: 72, systolic: 119, sleep: 7.2 },
  { month: "Jul", heartRate: 72, systolic: 118, sleep: 7.4 },
];

export const appointmentStats = [
  { month: "Mar", video: 3, clinic: 1 },
  { month: "Apr", video: 2, clinic: 2 },
  { month: "May", video: 4, clinic: 1 },
  { month: "Jun", video: 3, clinic: 3 },
  { month: "Jul", video: 5, clinic: 2 },
  { month: "Aug", video: 2, clinic: 1 },
];

export const medications = [
  { name: "Sumatriptan", dose: "50 mg", time: "08:00", taken: true, color: "primary" },
  { name: "Vitamin D3", dose: "1000 IU", time: "12:30", taken: true, color: "warning" },
  { name: "Magnesium", dose: "400 mg", time: "19:00", taken: false, color: "info" },
  { name: "Omega-3", dose: "1 capsule", time: "21:00", taken: false, color: "accent" },
];

export const activityFeed = [
  {
    id: "a1",
    title: "Lab results uploaded",
    meta: "Complete blood count · Bay Labs",
    time: "2h ago",
    kind: "file",
  },
  {
    id: "a2",
    title: "Prescription renewed",
    meta: "Sumatriptan 50mg · Dr. Clifford",
    time: "Yesterday",
    kind: "pill",
  },
  {
    id: "a3",
    title: "Appointment completed",
    meta: "Cardiology follow-up · Dr. Moreau",
    time: "18 Jul",
    kind: "check",
  },
  { id: "a4", title: "Invoice paid", meta: "INV-2402 · $48.00", time: "18 Jul", kind: "card" },
  {
    id: "a5",
    title: "New message",
    meta: "Dr. Okafor sent aftercare notes",
    time: "12 Jul",
    kind: "message",
  },
];

export const notifications = [
  {
    id: "n1",
    title: "Consultation starts in 30 minutes",
    body: "Dr. Tracey Clifford · Video call",
    time: "now",
    unread: true,
  },
  {
    id: "n2",
    title: "Lab results are ready",
    body: "Complete blood count available",
    time: "2h",
    unread: true,
  },
  {
    id: "n3",
    title: "Prescription refill approved",
    body: "Sumatriptan 50mg · 3 refills",
    time: "1d",
    unread: true,
  },
  {
    id: "n4",
    title: "Invoice INV-2402 paid",
    body: "$48.00 charged to Visa •• 4421",
    time: "3d",
    unread: false,
  },
];

export const healthTips = [
  {
    title: "Hydration lowers migraine frequency",
    body: "Aim for 2.2L of water daily. Patients with consistent hydration report 23% fewer migraine days.",
    tag: "Neurology",
  },
  {
    title: "Move every 45 minutes",
    body: "A two-minute walk each hour improves circulation and reduces resting heart rate over time.",
    tag: "Cardiology",
  },
  {
    title: "Protect your sleep window",
    body: "Going to bed within the same 30-minute window stabilises recovery and cognitive performance.",
    tag: "Wellbeing",
  },
];

export const devices = [
  { name: 'MacBook Pro 16"', location: "San Francisco, CA", last: "Active now", current: true },
  { name: "iPhone 15 Pro", location: "San Francisco, CA", last: "2 hours ago", current: false },
  { name: "iPad Air", location: "Oakland, CA", last: "5 days ago", current: false },
];
