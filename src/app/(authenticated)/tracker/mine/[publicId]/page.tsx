import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import { Banner } from "@/components/ui/banner";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {getMyTrackerReport} from "@/modules/bug-tracker/reporter-service";
import {TrackerAdminError} from "@/modules/bug-tracker/admin-errors";
import {trackerPublicIdSchema} from "@/modules/bug-tracker/admin-validation";
export const dynamic="force-dynamic";
export default async function MyTrackerReportDetail({
  params,
}:{params:Promise<{publicId:string}>}){
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")redirect("/dashboard");
  const {publicId}=await params;
  if(!trackerPublicIdSchema.safeParse(publicId).success)notFound();
  if(!trackerAdminRuntimeEnabled())return <div className="min-w-0 space-y-4">
    <PageHeader title="My report" description={publicId}/>
    <Banner tone="warning">Reports are temporarily unavailable. Try again soon.</Banner>
  </div>;
  let report;
  try{report=await getMyTrackerReport(context,publicId);}
  catch(error){
    if(error instanceof TrackerAdminError && error.code==="ISSUE_NOT_FOUND")notFound();
    // An unavailable database is a retryable page error, not a missing report.
    throw error;
  }
  if(!report)notFound();
  return <article className="min-w-0 max-w-full space-y-4">
    <PageHeader title={report.publicId} description={report.issueType}
      actions={<PageBackLink href="/tracker/mine" label="Back to my reports"/>}/>
    <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-5">
      <dl className="flex min-w-0 flex-wrap gap-x-6 gap-y-3 text-sm">
        <div className="flex min-h-11 items-center gap-2 md:min-h-9"><dt className="font-semibold text-[var(--lms-muted-text)]">Status:</dt><dd><StatusBadge tone={report.status==="CLOSED"?"success":"info"}>{report.status}</StatusBadge></dd></div>
        <div className="flex min-h-11 items-center gap-2 md:min-h-9"><dt className="font-semibold text-[var(--lms-muted-text)]">Severity:</dt><dd><StatusBadge tone={report.severity==="BLOCKER"||report.severity==="CRITICAL"?"error":"warning"}>{report.severity}</StatusBadge></dd></div>
      </dl>
      <p className="mt-3 max-w-3xl whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">{report.description}</p>
      <p className="mt-3 text-xs text-muted-foreground">Reported: <time dateTime={report.createdAt.toISOString()}>{report.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</time></p>
    </section>
  </article>;
}
