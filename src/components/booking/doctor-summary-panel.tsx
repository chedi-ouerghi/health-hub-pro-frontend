import { BadgeCheck, CalendarDays, HeartPulse, Star, Stethoscope, Users } from "lucide-react";
import type { Doctor } from "@/types/doctor.types";

interface DoctorStatsPanelProps {
  doctor: Doctor;
}

export function DoctorStatsPanel({ doctor }: DoctorStatsPanelProps) {
  const price = Number(doctor.consultationPrice) || 0;
  const currencySymbol = doctor.currency === "EUR" ? "€" : "$";
  const rating = Number(doctor.ratingAverage) || 0;
  const recommendation = Number(doctor.recommendationRate) || 0;

  const stats = [
    {
      icon: Stethoscope,
      label: "Consultation fee",
      value: `${currencySymbol}${price.toFixed(2)}`,
    },
    {
      icon: Users,
      label: "Patients treated",
      value: `${doctor.patientCount.toLocaleString()}+`,
    },
    {
      icon: Star,
      label: "Average rating",
      value: `${rating.toFixed(1)} (${doctor.reviewCount} reviews)`,
    },
    {
      icon: HeartPulse,
      label: "Recommendation",
      value: `${recommendation}%`,
    },
  ];

  return (
    <div className="surface-card p-7">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            {doctor.firstName} {doctor.lastName} — overview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only summary of this doctor&apos;s activity. Booking is available for patients
            only.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/70 px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          <CalendarDays className="size-3.5" />
          {doctor.isAcceptingNewPatients ? "Accepting patients" : "Not accepting patients"}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border p-5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary-soft">
              <stat.icon className="size-4 text-primary" />
            </span>
            <p className="mt-3 text-lg font-semibold tracking-tight">{stat.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="size-3.5 text-primary" />
          {doctor.yearsOfExperience} years of experience
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="size-3.5 text-primary" />
          License {doctor.licenseNumber}
        </span>
      </div>
    </div>
  );
}
