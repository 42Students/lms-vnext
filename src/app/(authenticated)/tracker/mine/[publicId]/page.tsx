import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
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
  if(!trackerAdminRuntimeEnabled())return <div className="space-y-4">
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
  return <article className="space-y-4">
    <PageHeader title={report.publicId} description={report.issueType}
      actions={<Link href="/tracker/mine" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9">Back to my reports</Link>}/>
    <section className="border-b border-border pb-5">
      <p className="text-sm font-semibold">Status: {report.status} · Severity: {report.severity}</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{report.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">Reported: {report.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
    </section>
  </article>;
}
