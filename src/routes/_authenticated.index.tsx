import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUserQuery } from "@/hooks/api/use-auth";
import { dashboardForRole } from "@/lib/role-utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Overview — MediCare" },
      {
        name: "description",
        content: "Your MediCare dashboard.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const userQuery = useCurrentUserQuery();
  const Dashboard = dashboardForRole(userQuery.data?.role);

  return <Dashboard />;
}
