import { useQuery } from "@tanstack/react-query";
import { activityLogsKeys } from "../../lib/api/query-keys";
import { activityLogsService } from "../../services/activity-logs.service";
import { useAuthStore } from "../../stores/auth-store";

export function useActivityLogsQuery() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: activityLogsKeys.me,
    queryFn: () => activityLogsService.listMine(1, 20),
    enabled: Boolean(user),
  });
}
