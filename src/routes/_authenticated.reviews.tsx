import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { MessageSquareQuote, Star } from "lucide-react";
import { fadeUp, stagger } from "@/components/layout/app-shell";
import { useAppointmentsQuery } from "@/hooks/api/use-appointments";
import { useCreateReviewMutation } from "@/hooks/api/use-reviews";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { useDoctorReviewsQuery } from "@/hooks/api/use-doctors";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Appointment } from "@/types/appointment.types";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({
    meta: [
      { title: "My Reviews — MediCare" },
      {
        name: "description",
        content: "Rate your completed consultations and review the care you received.",
      },
    ],
  }),
  component: ReviewsPage,
});

function ReviewsPage() {
  const userQuery = useCurrentUserQuery();
  const role = userQuery.data?.role ?? "PATIENT";

  if (role === "DOCTOR" || role === "ADMIN" || role === "SUPER_ADMIN") {
    return <ReceivedReviews />;
  }

  return <PatientReviews />;
}

// ── DOCTOR / ADMIN: reviews received (read-only) ──────────────────────────────

function ReceivedReviews() {
  const userQuery = useCurrentUserQuery();
  const doctorId = userQuery.data?.doctor?.id;

  const reviewsQuery = useDoctorReviewsQuery(doctorId ?? "", { limit: 50 });
  const reviews = reviewsQuery.data?.data ?? [];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h2 className="text-2xl font-semibold tracking-tight">Patient reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {reviews.length} review{reviews.length === 1 ? "" : "s"} · average{" "}
          {reviews.length > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
            : "—"}{" "}
          / 5
        </p>
      </motion.div>

      {reviewsQuery.isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="surface-card grid place-items-center py-24 text-center"
        >
          <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
            <MessageSquareQuote className="size-6 text-primary" />
          </span>
          <p className="mt-5 text-base font-semibold">No reviews yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Reviews appear here once your patients rate their completed consultations.
          </p>
        </motion.div>
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const patientName = review.patient
              ? `${review.patient.firstName} ${review.patient.lastName}`
              : "Patient";
            return (
              <li key={review.id} className="surface-card p-6">
                <div className="flex items-start gap-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-sm font-semibold">
                    {patientName
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{patientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="mt-1.5 flex gap-0.5">
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
                    {review.comment && (
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
}

// ── PATIENT: review completed consultations ───────────────────────────────────

function PatientReviews() {
  const [target, setTarget] = useState<{
    appointmentId: string;
    doctorName: string;
  } | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const createReview = useCreateReviewMutation();

  const appointmentsQuery = useAppointmentsQuery({ limit: 100 });
  const completed = (appointmentsQuery.data?.data ?? [])
    .filter((a) => a.status === "COMPLETED")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  const submitReview = () => {
    if (!target) return;
    createReview.mutate(
      {
        appointmentId: target.appointmentId,
        rating,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      },
      {
        onSuccess: () => {
          setTarget(null);
          setComment("");
          setRating(5);
          toast.success("Review submitted", {
            description: `Thanks for reviewing ${target.doctorName}.`,
          });
        },
        onError: (err) => {
          toast.error("Review failed", {
            description: err instanceof Error ? err.message : "Please try again.",
          });
        },
      },
    );
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp}>
        <h2 className="text-2xl font-semibold tracking-tight">My reviews</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Rate completed consultations to help other patients.
        </p>
      </motion.div>

      {appointmentsQuery.isPending ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))}
        </div>
      ) : completed.length === 0 ? (
        <motion.div
          variants={fadeUp}
          className="surface-card grid place-items-center py-24 text-center"
        >
          <span className="grid size-14 place-items-center rounded-3xl bg-primary-soft">
            <MessageSquareQuote className="size-6 text-primary" />
          </span>
          <p className="mt-5 text-base font-semibold">No completed consultations yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            You'll be able to leave a review once a consultation is completed.
          </p>
        </motion.div>
      ) : (
        <ul className="space-y-4">
          {completed.map((appointment) => {
            const doctor = appointment.doctor;
            const doctorName = doctor ? `${doctor.firstName} ${doctor.lastName}` : "Doctor";
            const existing = appointment.review;
            return (
              <li key={appointment.id} className="surface-card p-6">
                <div className="flex items-start gap-4">
                  {doctor?.photoUrl && (
                    <img
                      src={doctor.photoUrl}
                      alt=""
                      loading="lazy"
                      className="size-12 rounded-2xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{doctorName}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(appointment.scheduledAt).toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    {existing ? (
                      <div className="mt-3 rounded-2xl bg-muted/60 p-4">
                        <span className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "size-3.5",
                                i < existing.rating ? "fill-warning text-warning" : "text-border",
                              )}
                            />
                          ))}
                        </span>
                        {existing.comment && (
                          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                            {existing.comment}
                          </p>
                        )}
                      </div>
                    ) : (
                      <Button
                        className="mt-3 rounded-2xl"
                        onClick={() => setTarget({ appointmentId: appointment.id, doctorName })}
                      >
                        Leave a review
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(target)} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review your visit</DialogTitle>
            <DialogDescription>Rate your consultation with {target?.doctorName}.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setRating(i + 1)}
                aria-label={`${i + 1} star${i === 0 ? "" : "s"}`}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={cn("size-8", i < rating ? "fill-warning text-warning" : "text-border")}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)…"
            className="mt-2 h-28 resize-none rounded-2xl"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-2xl" onClick={() => setTarget(null)}>
              Cancel
            </Button>
            <Button
              className="rounded-2xl"
              onClick={submitReview}
              disabled={createReview.isPending}
            >
              {createReview.isPending ? "Submitting…" : "Submit review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
