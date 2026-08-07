import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  Clock,
  GraduationCap,
  Heart,
  Languages,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { BookingPanel } from "@/components/booking/booking-panel";
import { DoctorStatsPanel } from "@/components/booking/doctor-summary-panel";
import { useDoctorQuery, useDoctorReviewsQuery } from "@/hooks/api/use-doctors";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { useFavorites } from "@/hooks/use-favorites";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const Route = createFileRoute("/_authenticated/find-doctor/$doctorId")({
  loader: ({ params }) => ({ doctorId: params.doctorId }),
  head: () => ({
    meta: [
      { title: "Doctor profile — MediCare" },
      { name: "description", content: "Specialist profile, availability and patient reviews." },
    ],
  }),
  component: DoctorProfilePage,
  errorComponent: ({ error }) => (
    <p role="alert" className="surface-card p-10 text-sm">
      {error.message}
    </p>
  ),
  notFoundComponent: () => (
    <div className="surface-card grid place-items-center p-16 text-center">
      <p className="text-base font-semibold">We couldn't find that doctor</p>
      <Button asChild className="mt-5 rounded-2xl">
        <Link to="/find-doctor">Back to search</Link>
      </Button>
    </div>
  ),
});

const JS_DAY_TO_PRISMA = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
] as const;

function DoctorProfilePage() {
  const { doctorId } = Route.useLoaderData();
  const doctorQuery = useDoctorQuery(doctorId);
  const reviewsQuery = useDoctorReviewsQuery(doctorId, { limit: 8 });
  const userQuery = useCurrentUserQuery();
  const { isFavorite, toggle } = useFavorites();

  const doctor = doctorQuery.data;
  const reviews = reviewsQuery.data?.data ?? [];
  const isPatient = userQuery.data?.role === "PATIENT";

  if (doctorQuery.isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-40 rounded-xl" />
        <div className="grid grid-cols-12 gap-5">
          <Skeleton className="col-span-4 h-[720px] rounded-3xl" />
          <div className="col-span-8 space-y-5">
            <Skeleton className="h-96 rounded-3xl" />
            <Skeleton className="h-64 rounded-3xl" />
          </div>
        </div>
      </div>
    );
  }

  if (doctorQuery.isError || !doctor) {
    return (
      <div className="surface-card grid place-items-center p-16 text-center">
        <p className="text-base font-semibold">We couldn't find that doctor</p>
        <Button asChild className="mt-5 rounded-2xl">
          <Link to="/find-doctor">Back to search</Link>
        </Button>
      </div>
    );
  }

  const favorite = isFavorite(doctor.id);
  const name = `${doctor.firstName} ${doctor.lastName}`;
  const specialty = doctor.specialty?.name ?? "";
  const today = JS_DAY_TO_PRISMA[new Date().getDay()];
  const availableToday = (doctor.availabilities ?? []).some((a) => a.dayOfWeek === today);
  const languages = (doctor.languages ?? []).map((l) => l.language.name).join(", ");
  const focus = (doctor.focusAreas ?? []).map((f) => f.focusArea.name);
  const rating = Number(doctor.ratingAverage) || 0;
  const price = Number(doctor.consultationPrice) || 0;
  const currencySymbol = doctor.currency === "EUR" ? "€" : "$";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={fadeUp}>
        <Link
          to="/find-doctor"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Back to search
        </Link>
      </motion.div>

      <div className="grid grid-cols-12 gap-5">
        <motion.aside variants={fadeUp} className="col-span-4 space-y-5">
          <div className="surface-card overflow-hidden">
            <div className="relative gradient-teal px-7 pb-24 pt-7">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-[11px] font-semibold text-success">
                <span className="size-1.5 rounded-full bg-success" />
                {availableToday ? "Available Today" : "Book a slot below"}
              </span>
              {doctor.photoUrl && (
                <img
                  src={doctor.photoUrl}
                  alt={name}
                  width={512}
                  height={512}
                  className="absolute -bottom-2 right-5 h-56 w-44 rounded-3xl object-cover"
                />
              )}
              <h2 className="mt-24 max-w-[55%] text-2xl font-semibold leading-tight tracking-tight text-primary-foreground">
                {name}
              </h2>
              <p className="mt-1 text-sm text-primary-foreground/80">{specialty}</p>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary-foreground">
                <Star className="size-4 fill-warning text-warning" />
                {rating.toFixed(1)}
                <span className="font-normal text-primary-foreground/70">
                  ({doctor.reviewCount} reviews)
                </span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 px-6 py-5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toast("Messaging is coming soon")}
                      className="rounded-2xl border border-border py-3 opacity-70 transition-all hover:border-primary/40 hover:bg-primary-soft/60"
                    >
                      <MessageSquare className="mx-auto size-4 text-primary" />
                      <span className="mt-1.5 block text-[10px] font-medium">Message</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Bientôt disponible</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <button
                onClick={() => {
                  toggle(doctor.id);
                  toast(favorite ? "Removed from favorites" : "Added to favorites");
                }}
                aria-pressed={favorite}
                className="rounded-2xl border border-border py-3 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary-soft/60"
              >
                <Heart
                  className={cn(
                    "mx-auto size-4",
                    favorite ? "fill-destructive text-destructive" : "text-primary",
                  )}
                />
                <span className="mt-1.5 block text-[10px] font-medium">Save</span>
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-4 border-t border-border px-6 py-5 text-xs">
              {[
                { icon: Clock, title: `${doctor.yearsOfExperience} Years`, sub: "Experience" },
                { icon: Languages, title: languages || "—", sub: "Languages" },
                { icon: Users, title: `${doctor.patientCount}+`, sub: "Patients" },
                { icon: BadgeCheck, title: doctor.licenseNumber, sub: "License" },
                {
                  icon: Building2,
                  title: `${Number(doctor.recommendationRate) || 0}%`,
                  sub: "Recommendation",
                },
                { icon: MapPin, title: `${doctor.city}`, sub: "Location" },
              ].map((item) => (
                <div key={item.sub} className="flex items-start gap-2">
                  <item.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <dt className="truncate font-medium">{item.title}</dt>
                    <dd className="text-muted-foreground">{item.sub}</dd>
                  </div>
                </div>
              ))}
            </dl>

            <div className="border-t border-border px-6 py-5">
              <p className="text-sm font-semibold">About Doctor</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {doctor.bio || "No biography provided."}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-5 border-t border-border px-6 py-5">
              <div>
                <p className="text-sm font-semibold">Specializations</p>
                <ul className="mt-3 space-y-2">
                  {(focus.length ? focus : [specialty]).map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                      <BadgeCheck className="size-3.5 text-primary" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold">Education</p>
                <ul className="mt-3 space-y-3">
                  {(doctor.educations ?? []).map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <GraduationCap className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>
                        <span className="block text-xs font-medium">{item.school}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {item.degree}
                        </span>
                        <span className="block text-[11px] text-muted-foreground/80">
                          {item.startYear} — {item.endYear ?? "present"}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {(doctor.certificates ?? []).length > 0 && (
              <div className="border-t border-border px-6 py-5">
                <p className="text-sm font-semibold">Certificates</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {doctor.certificates!.map((cert) => (
                    <div key={cert.id} className="rounded-2xl border border-border p-3 text-center">
                      <Award className="mx-auto size-4 text-primary" />
                      <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
                        {cert.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.aside>

        <motion.div variants={fadeUp} className="col-span-8 space-y-5">
          {isPatient ? <BookingPanel doctor={doctor} /> : <DoctorStatsPanel doctor={doctor} />}

          <div className="surface-card p-7">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold tracking-tight">Patient reviews</h3>
              <span className="flex items-center gap-1.5 text-sm">
                <Star className="size-4 fill-warning text-warning" />
                <span className="font-semibold">{rating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  · {doctor.reviewCount.toLocaleString()} reviews
                </span>
              </span>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-4">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {review.patient
                        ? `${review.patient.firstName} ${review.patient.lastName}`
                        : "Patient"}
                    </p>
                    <span className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3.5",
                            i < review.rating ? "fill-warning text-warning" : "text-border",
                          )}
                        />
                      ))}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    {review.comment}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground/80">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
