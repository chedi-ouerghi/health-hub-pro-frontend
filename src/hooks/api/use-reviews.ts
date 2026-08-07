import { useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentsKeys, doctorsKeys, reviewsKeys } from "../../lib/api/query-keys";
import { reviewsService } from "../../services/reviews.service";
import type { CreateReviewDto } from "../../types/review.types";

export function useCreateReviewMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateReviewDto) => reviewsService.create(payload),
    onSuccess: (newReview) => {
      queryClient.invalidateQueries({ queryKey: reviewsKeys.all });
      queryClient.invalidateQueries({ queryKey: appointmentsKeys.all });
      if (newReview.doctorId) {
        queryClient.invalidateQueries({
          queryKey: doctorsKeys.detail(newReview.doctorId),
        });
        queryClient.invalidateQueries({
          queryKey: doctorsKeys.reviews(newReview.doctorId),
        });
      }
    },
  });
}
