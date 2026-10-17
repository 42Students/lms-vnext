import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {listMyTrackerReports} from "@/modules/bug-tracker/reporter-service";
export const dynamic="force-dynamic";
export const metadata={title:"My Reports · 42 Tracker"};
export default async function MyTrackerReportsPage(){
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")redirect("/dashboard");
  if(!trackerAdminRuntimeEnabled())return <div role="status" className="space-y-4">
    <PageHeader title="My reports" description="See the issues you have reported."/>
    <p className="text-sm text-body">Reports are temporarily unavailable. Try again soon.</p>
  </div>;
  let reports;
  try{reports=await listMyTrackerReports(context);}
  catch{return <div role="alert" className="space-y-4">
    <PageHeader title="My reports" description="See the issues you have reported."/>
    <p>We could not load your reports.</p>
    <Link href="/tracker/mine" className="font-semibold text-primary-text underline">Retry</Link>
  </div>;}
  return <section className="space-y-5">
    <PageHeader title="My reports" description="See the issues you have reported."/>
    <Link href="/tracker" className="font-semibold text-primary-text underline">Report an issue</Link>
    {!reports.length?<p className="rounded-lg border border-border p-5 text-sm text-body">You have not reported any issues yet.</p>:
      <ul className="space-y-3">{reports.map(item=><li key={item.publicId}
        className="rounded-lg border border-border bg-surface p-4">
        <Link href={"/tracker/mine/"+encodeURIComponent(item.publicId)}
          className="font-semibold text-primary-text underline">{item.publicId}</Link>
        <p className="mt-1 text-sm text-body">{item.issueType} · {item.status}</p>
        <p className="mt-1 text-sm text-body">{item.description}</p>
      </li>)}</ul>}
  </section>;
}
