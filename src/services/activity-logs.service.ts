import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type { ActivityLogsResult } from "../types/activity.types";

export const activityLogsService = {
  listMine: async (page = 1, limit = 20): Promise<ActivityLogsResult> => {
    const res = await apiClient.get<ApiResponse<ActivityLogsResult>>("/activity-logs/me", {
      params: { page, limit },
    });
    return unwrap(res);
  },
};
