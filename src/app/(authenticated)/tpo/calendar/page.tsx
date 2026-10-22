import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import Link from "next/link";
import { redirect } from "next/navigation";
import {headers} from "next/headers";

import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementCalendarWorkspace } from "@/components/placements/placement-calendar-workspace";
import { hasMembershipRole } from "@/modules/identity/context";
import {initialTpoCalendarView,parseTpoCalendarUrl} from "@/modules/placements/tpo-calendar-url-model";
import {requirePersistedTpoMembership} from "@/modules/placements/tpo-persisted-actor-service";
import { TpoCalendarViewportDefault } from "./tpo-calendar-viewport-default";

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
  // SSR cannot see a narrow desktop viewport. When no explicit ?view was
  // bookmarked, correct the initial week/agenda default after hydration.
  const clientParams=new URLSearchParams();
  for(const key of ["date","company","kind","kinds"] as const){
    const value=first(raw[key]);
    if(value!==undefined)clientParams.set(key,value);
  }
  const clientHref="/tpo/calendar"+(clientParams.size?"?"+clientParams.toString():"");
  if(!parsed.success)return <div className="space-y-4">
    <PageHeader title="Invalid calendar filters" />
    <Alert tone="error">
      Enter a valid day, calendar view, event kind and company filter. No events were queried.
    </Alert>
    <Link href="/tpo/calendar" className="inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center text-link underline lms-inline-link">Reset calendar filters</Link>
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
