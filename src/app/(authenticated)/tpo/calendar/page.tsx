import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { redirect } from "next/navigation";
import {headers} from "next/headers";

import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementCalendarWorkspace } from "@/components/placements/placement-calendar-workspace";
import { hasMembershipRole } from "@/modules/identity/context";
import {initialTpoCalendarView,parseTpoCalendarUrl} from "@/modules/placements/tpo-calendar-url-model";
import {requirePersistedTpoMembership} from "@/modules/placements/tpo-persisted-actor-service";

type SearchParams = {
  date?: string | string[];
  view?: string | string[];
  company?: string | string[];
  kind?: string | string[];
  kinds?: string | string[];
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

  await requirePersistedTpoMembership(context,context.membership.collegeId);
  const raw=await searchParams;
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const agent=(await headers()).get("user-agent")??"";
  const parsed=parseTpoCalendarUrl({
    date:first(raw.date),view:first(raw.view)??initialTpoCalendarView(agent),company:first(raw.company),kind:first(raw.kind),
  });
  if(!parsed.success)return <div className="space-y-4">
    <PageHeader title="Invalid calendar filters" />
    <p role="alert" className="rounded border border-border bg-surface p-4 text-sm text-body">
      Enter a valid day, calendar view, event kind and company filter. No events were queried.
    </p>
    <Link href="/tpo/calendar" className="inline-flex min-h-11 sm:min-h-9 items-center text-link underline">Reset calendar filters</Link>
  </div>;
  return (
    <div className="space-y-4">
      <Link href="/tpo/calendar/export"
        className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
        Export upcoming rounds CSV →
      </Link>
      <Link href="/tpo/calendar/interviews"
        className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
        Interview schedule readiness →
      </Link>
      <Link href="/tpo/calendar/rounds"
        className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
        Create, reschedule or cancel a drive round →
      </Link>
      <PlacementCalendarWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        audience="TPO"
        searchParams={{...parsed.data,kinds:first(raw.kinds)}}
      />
    </div>
  );
}
