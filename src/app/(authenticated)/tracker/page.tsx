import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { TrackerAdminNav } from "@/components/tracker/tracker-admin-nav";
import { TrackerReportForm } from "@/components/tracker/tracker-report-form";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { isSuperAdmin } from "@/modules/identity/context";
import { trackerAdminRuntimeEnabled } from "@/modules/bug-tracker/readiness";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

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
  // DB10 does not issue anonymous reporter sessions. Keep the signed-in-only
  // policy explicit rather than presenting an unauthenticated form that cannot save.
  const context=await getCurrentRequestContext().catch(()=>null);
  if(!context||context.user.platformStatus!=="ACTIVE")return <section className="space-y-4">
    <PageHeader title="42 Tracker · Report Issue"/>
    <ErrorState title="Sign in to report an issue"
      description="The old LMS allowed anonymous reports. This workspace requires a signed-in reporter so only you can access your submitted reports. Your report has not been submitted."
      action={<TextLink href="/login?returnTo=%2Ftracker">Sign in and return to Report Issue</TextLink>}/>
  </section>;
  const ready = trackerAdminRuntimeEnabled();
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader eyebrow="42 Tracker" title="What went wrong?"
      description="Report an LMS issue · Pick the context, describe the problem, and submit. Sign-in is required to keep reports linked to your account."
      actions={!isSuperAdmin(context)?<ButtonLink variant="secondary" href="/tracker/mine">My reports</ButtonLink>:undefined}/>
    {isSuperAdmin(context)?<TrackerAdminNav />:<Tabs renderPanel={false} value="report" ariaLabel="42 Tracker"
      items={[{value:"report",label:"Report Issue",href:"/tracker"},{value:"mine",label:"My reports",href:"/tracker/mine"}]}/>}
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Report an LMS issue</p>
    {!ready ? <Banner tone="warning">
      <strong>Reports are temporarily unavailable.</strong>
      <span>Try again soon. Your report has not been submitted.</span>
    </Banner> : <section aria-label="Report Issue" className="min-w-0 max-w-4xl rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
      <TrackerReportForm contextPrefill={contextPrefill} canSearchSimilar={isSuperAdmin(context)}
      {...(isSuperAdmin(context) && knownErrorId !== undefined ? {knownErrorId} : {})}/></section>}
  </div>;
}
