import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationsKeys } from "../../lib/api/query-keys";
import { notificationsService } from "../../services/notifications.service";
import { useAuthStore } from "../../stores/auth-store";

export function useNotificationsQuery() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: notificationsKeys.me,
    queryFn: () => notificationsService.listMine(1, 20),
    enabled: Boolean(user),
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationsService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationsKeys.all });
    },
  });
}
