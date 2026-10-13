import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementCalendarWorkspace } from "@/components/placements/placement-calendar-workspace";
import { hasMembershipRole } from "@/modules/identity/context";

type SearchParams = {
  date?: string | string[];
  view?: string | string[];
  company?: string | string[];
  kind?: string | string[];
};

export default async function TpoCalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context =
    await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  return (
    <PlacementCalendarWorkspace
      context={context}
      collegeId={context.membership.collegeId}
      audience="TPO"
      searchParams={await searchParams}
    />
  );
}
