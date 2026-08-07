import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type { CreateReviewDto, Review } from "../types/review.types";

export const reviewsService = {
  create: async (payload: CreateReviewDto): Promise<Review> => {
    const res = await apiClient.post<ApiResponse<Review>>("/reviews", payload);
    return unwrap(res);
  },
};
