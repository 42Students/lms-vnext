import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import { Banner } from "@/components/ui/banner";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {getMyTrackerReport,listMyTrackerReportHistory,listMyTrackerReportScreenshots} from "@/modules/bug-tracker/reporter-service";
import {TrackerAdminError} from "@/modules/bug-tracker/admin-errors";
import {trackerPublicIdSchema} from "@/modules/bug-tracker/admin-validation";
export const dynamic="force-dynamic";
export default async function MyTrackerReportDetail({
  params,
}:{params:Promise<{publicId:string}>}){
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")redirect("/dashboard");
  const {publicId}=await params;
  // Legacy URLs used a decimal sequence or a differently cased LMS prefix.
  // Map display aliases to a canonical public ID; reporter ownership is still
  // enforced independently by every issue, attachment and history query.
  const canonical=/^[1-9][0-9]{0,8}$/.test(publicId)
    ?"LMS-"+publicId.padStart(4,"0")
    :publicId.toUpperCase();
  if(!trackerPublicIdSchema.safeParse(canonical).success)notFound();
  if(canonical!==publicId)redirect("/tracker/mine/"+encodeURIComponent(canonical));
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
  const [history,screenshots]=await Promise.all([
    listMyTrackerReportHistory(context,publicId),
    listMyTrackerReportScreenshots(context,publicId),
  ]);
  return <article className="min-w-0 max-w-full space-y-4">
    <PageHeader title={report.publicId} description={report.issueType}
      actions={<PageBackLink href="/tracker/mine" label="Back to my reports"/>}/>
    <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-5">
      <dl className="flex min-w-0 flex-wrap gap-x-6 gap-y-3 text-sm">
        <div className="flex min-h-11 items-center gap-2 md:min-h-9"><dt className="font-semibold text-[var(--lms-muted-text)]">Status:</dt><dd><StatusBadge tone={report.status==="CLOSED"?"success":"info"}>{report.status}</StatusBadge></dd></div>
        <div className="flex min-h-11 items-center gap-2 md:min-h-9"><dt className="font-semibold text-[var(--lms-muted-text)]">Severity:</dt><dd><StatusBadge tone={report.severity==="BLOCKER"||report.severity==="CRITICAL"?"error":"warning"}>{report.severity}</StatusBadge></dd></div>
      </dl>
      <dl className="mt-3 grid grid-cols-1 gap-2 text-sm md:grid-cols-2">
        <div><dt className="font-semibold text-muted-foreground">Page</dt><dd className="break-all">{report.page || "—"}</dd></div>
        <div><dt className="font-semibold text-muted-foreground">Screen</dt><dd>{report.screen || "—"}</dd></div>
        <div><dt className="font-semibold text-muted-foreground">Section</dt><dd>{report.section || "—"}</dd></div>
        <div><dt className="font-semibold text-muted-foreground">Environment</dt><dd>{report.environment}</dd></div>
      </dl>
      <h2 className="mt-4 text-base font-semibold text-[var(--lms-heading)]">Description</h2>
      <p className="mt-2 max-w-3xl whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">{report.description}</p>
      {report.evidenceLink?.startsWith("https://") ? <p className="mt-3 text-sm">
        <a href={report.evidenceLink} rel="noopener noreferrer" target="_blank" className="font-semibold text-link underline">Open linked evidence</a>
      </p> : null}
      <p className="mt-3 text-xs text-muted-foreground">Reported: <time dateTime={report.createdAt.toISOString()}>{report.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</time></p>
    </section>
    <section className="space-y-3 border-b border-[var(--lms-canvas-border)] pb-5">
      <h2 className="text-base font-semibold text-[var(--lms-heading)]">Screenshots ({screenshots.length})</h2>
      {screenshots.length===0 ? <p className="text-sm text-muted-foreground">No screenshots attached.</p> :
        <ul className="space-y-2">{screenshots.map(file=><li key={file.id} className="text-sm">
          <span className="break-words">{file.originalFilename}</span>
          <span className="text-muted-foreground"> · {(Number(file.sizeBytes)/1024).toFixed(0)} KB</span>
        </li>)}</ul>}
      <p className="text-xs text-muted-foreground">Files are shown as metadata only until an authorized short-lived preview is available.</p>
    </section>
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-[var(--lms-heading)]">Activity</h2>
      {history.length===0?<p className="text-sm text-muted-foreground">No status changes yet.</p>:
        <ol className="space-y-3">{history.map(row=><li key={row.id} className="border-b border-border pb-3 text-sm">
          <span className="font-semibold">{row.type}</span>
          <span className="ml-2 text-muted-foreground">{row.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</span>
        </li>)}</ol>}
    </section>
  </article>;
}
