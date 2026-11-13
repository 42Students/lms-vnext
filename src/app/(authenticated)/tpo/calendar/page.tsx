import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { redirect } from "next/navigation";
import {headers} from "next/headers";

import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementCalendarWorkspace } from "@/components/placements/placement-calendar-workspace";
import { hasMembershipRole } from "@/modules/identity/context";
import {initialTpoCalendarView,parseTpoCalendarUrl} from "@/modules/placements/tpo-calendar-url-model";
import {requirePersistedTpoMembership} from "@/modules/placements/tpo-persisted-actor-service";
import { TpoCalendarViewportDefault } from "./tpo-calendar-viewport-default";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
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
    !hasMembershipRole(context, ROLE.TPO)
  ) {
    redirect("/dashboard");
  }

  await requirePersistedTpoMembership(context,context.membership.collegeId);
  const raw=await searchParams;
  // A repeated query parameter is ambiguous: never silently select the first
  // value and then fetch private calendar events for an unintended filter.
  const repeatedFilter=Object.values(raw).some(Array.isArray);
  const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const agent=(await headers()).get("user-agent")??"";
  const parsed=parseTpoCalendarUrl({
    date:first(raw.date),view:first(raw.view)??initialTpoCalendarView(agent),company:first(raw.company),kind:first(raw.kind),
  });
  // SSR cannot see a narrow desktop viewport. When no explicit ?view was
  // bookmarked, correct the initial week/agenda default after hydration.
  const clientParams=new URLSearchParams();
  for(const key of ["date","company","kind","kinds"] as const){
    const value=first(raw[key]);
    if(value!==undefined)clientParams.set(key,value);
  }
  const clientHref="/tpo/calendar"+(clientParams.size?"?"+clientParams.toString():"");
  if(repeatedFilter||!parsed.success)return <div className="space-y-4">
    <PageHeader title="Invalid calendar filters" />
    <Alert tone="error">
      Enter one valid value for each day, view, event kind and company filter. Repeated filters are not accepted. No events were queried.
    </Alert>
    <TextLink href="/tpo/calendar" className="inline-flex min-h-11 md:min-h-[var(--lms-control-height)] items-center">Reset calendar filters</TextLink>
  </div>;
  return (
    <div className="min-w-0 space-y-4">
      {raw.view===undefined?<TpoCalendarViewportDefault
        initialView={parsed.data.view??"week"} baseHref={clientHref}/>:null}
      <PlacementCalendarWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        audience="TPO"
        searchParams={{...parsed.data,...(first(raw.kinds) === undefined ? {} : { kinds: first(raw.kinds) })}}
      />
    </div>
  );
}
