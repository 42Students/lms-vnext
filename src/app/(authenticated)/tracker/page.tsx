import { Banner } from "@/components/ui/banner";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { TrackerReportForm } from "@/components/tracker/tracker-report-form";
import { PageHeader } from "@/components/ui/page-header";
import { isSuperAdmin } from "@/modules/identity/context";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";

/** SA-placements-projects-100: authenticated reporter intake until OD-27 is resolved. */
export const metadata={title:"Report Issue · 42 Tracker"};
export default async function TrackerReportPage({
  searchParams,
}:{searchParams:Promise<{context?:string|string[];knownErrorId?:string|string[]}>}) {
  const raw=await searchParams;
  const contextPrefill=typeof raw.context==="string"?raw.context.slice(0,450):"";
  const knownErrorId=typeof raw.knownErrorId==="string"&&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw.knownErrorId)
    ?raw.knownErrorId:undefined;
  const context = await getCurrentRequestContext();
  if (context.user.platformStatus !== "ACTIVE") redirect("/dashboard");
  const ready = trackerAdminRuntimeEnabled();
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Report an LMS issue" title="What went wrong?"
      description="Pick the context, describe the problem, and submit."
      actions={!isSuperAdmin(context)?<Link href="/tracker/mine" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">My reports</Link>:undefined}/>
    {isSuperAdmin(context)?<TrackerAdminNav />:null}
    {!ready ? <Banner tone="warning">
      <strong>Reports are temporarily unavailable.</strong>
      <span>Try again soon. Your report has not been submitted.</span>
    </Banner> : <TrackerReportForm contextPrefill={contextPrefill} canSearchSimilar={isSuperAdmin(context)}
      knownErrorId={isSuperAdmin(context)?knownErrorId:undefined} />}
  </div>;
}
