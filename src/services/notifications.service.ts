import { apiClient, unwrap } from "../lib/api/client";
import type { ApiResponse } from "../types/api.types";
import type { Notification, NotificationsResult } from "../types/notification.types";

export const notificationsService = {
  listMine: async (page = 1, limit = 20): Promise<NotificationsResult> => {
    const res = await apiClient.get<ApiResponse<NotificationsResult>>("/notifications/me", {
      params: { page, limit },
    });
    return unwrap(res);
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const res = await apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return unwrap(res);
  },
};
