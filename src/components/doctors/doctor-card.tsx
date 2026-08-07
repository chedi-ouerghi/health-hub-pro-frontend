import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Heart, MapPin, Star, Stethoscope } from "lucide-react";
import type { Doctor } from "@/types/doctor.types";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { fadeUp } from "@/components/layout/app-shell";

const JS_DAY_TO_PRISMA = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

export function DoctorCard({ doctor }: { doctor: Doctor }) {
  const { isFavorite, toggle } = useFavorites();
  const favorite = isFavorite(doctor.id);

  const name = `${doctor.firstName} ${doctor.lastName}`;
  const specialty = doctor.specialty?.name ?? "";
  const today = JS_DAY_TO_PRISMA[new Date().getDay()];
  const availableToday = (doctor.availabilities ?? []).some((a) => a.dayOfWeek === today);
  const rating = Number(doctor.ratingAverage) || 0;
  const price = Number(doctor.consultationPrice) || 0;
  const currencySymbol = doctor.currency === "EUR" ? "€" : "$";

  return (
    <motion.article
      variants={fadeUp}
      whileHover={{ y: -5 }}
      className="surface-card overflow-hidden"
    >
      <div className="relative">
        <div className="h-24 gradient-teal" />
        <button
          onClick={() => toggle(doctor.id)}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorite}
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-xl bg-card/90 backdrop-blur transition-transform hover:scale-105"
        >
          <Heart
            className={cn(
              "size-4",
              favorite ? "fill-destructive text-destructive" : "text-muted-foreground",
            )}
          />
        </button>
        {doctor.photoUrl && (
          <img
            src={doctor.photoUrl}
            alt={name}
            loading="lazy"
            width={512}
            height={512}
            className="absolute -bottom-8 left-6 size-20 rounded-3xl border-4 border-card object-cover"
          />
        )}
        {availableToday && (
          <span className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full bg-card px-2.5 py-1 text-[10px] font-semibold text-success shadow-sm">
            <span className="size-1.5 rounded-full bg-success" /> Available Today
          </span>
        )}
      </div>

      <div className="px-6 pb-6 pt-11">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight">{name}</h3>
            <p className="text-xs text-muted-foreground">{specialty}</p>
          </div>
          <span className="flex items-center gap-1 rounded-full bg-warning/12 px-2.5 py-1 text-[11px] font-semibold text-warning-foreground">
            <Star className="size-3 fill-warning text-warning" />
            {rating.toFixed(1)}
            <span className="font-normal text-muted-foreground">({doctor.reviewCount})</span>
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          <Badge>{doctor.yearsOfExperience} yrs experience</Badge>
          <Badge>
            <Stethoscope className="size-3" /> In-clinic consult
          </Badge>
        </div>

        <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
          <li className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" /> {doctor.city}, {doctor.country}
          </li>
        </ul>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
          <div>
            <p className="text-[11px] text-muted-foreground">Consultation</p>
            <p className="text-lg font-semibold">
              {currencySymbol}
              {price.toFixed(0)}
              <span className="text-xs font-normal text-muted-foreground"> / visit</span>
            </p>
          </div>
          <Button asChild className="h-10 rounded-2xl px-5">
            <Link to="/find-doctor/$doctorId" params={{ doctorId: doctor.id }}>
              Book Appointment
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary">
      {children}
    </span>
  );
}
