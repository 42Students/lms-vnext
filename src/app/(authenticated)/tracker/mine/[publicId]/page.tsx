import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {getMyTrackerReport} from "@/modules/bug-tracker/reporter-service";
import {trackerPublicIdSchema} from "@/modules/bug-tracker/admin-validation";
export const dynamic="force-dynamic";
export default async function MyTrackerReportDetail({
  params,
}:{params:Promise<{publicId:string}>}){
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")redirect("/dashboard");
  const {publicId}=await params;
  if(!trackerPublicIdSchema.safeParse(publicId).success)notFound();
  if(!trackerAdminRuntimeEnabled())return <p role="status">Reports are temporarily unavailable. Try again soon.</p>;
  const report=await getMyTrackerReport(context,publicId).catch(()=>null);
  if(!report)notFound();
  return <article className="space-y-4">
    <PageHeader title={report.publicId} description={report.issueType}/>
    <Link href="/tracker/mine" className="font-semibold text-primary-text underline">Back to my reports</Link>
    <section className="rounded-lg border border-border bg-surface p-5">
      <p className="text-sm font-semibold">Status: {report.status} · Severity: {report.severity}</p>
      <p className="mt-2 text-sm text-body">{report.description}</p>
      <p className="mt-2 text-xs text-muted-foreground">Reported: {report.createdAt.toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}</p>
    </section>
  </article>;
}
