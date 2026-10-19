import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {listMyTrackerReports} from "@/modules/bug-tracker/reporter-service";
export const dynamic="force-dynamic";
export const metadata={title:"My Reports · 42 Tracker"};
export default async function MyTrackerReportsPage(){
  const context=await getCurrentRequestContext();
  if(context.user.platformStatus!=="ACTIVE")redirect("/dashboard");
  if(!trackerAdminRuntimeEnabled())return <div className="space-y-4">
    <PageHeader title="My reports" description="See the issues you have reported."/>
    <Banner tone="warning">Reports are temporarily unavailable. Try again soon.</Banner>
  </div>;
  let reports;
  try{reports=await listMyTrackerReports(context);}
  catch{return <div className="space-y-4">
    <PageHeader title="My reports" description="See the issues you have reported."/>
    <ErrorState title="Could not load reports" description="We could not load your reports."
      action={<Link href="/tracker/mine" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>} />
  </div>;}
  return <section className="space-y-5">
    <PageHeader title="My reports" description="See the issues you have reported."/>
    <Link href="/tracker" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Report an issue</Link>
    {!reports.length?<EmptyState title="No reports yet" description="You have not reported any issues yet." />:
      <ul className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{reports.map(item=><li key={item.publicId}
        className="py-[var(--lms-space-3)]">
        <Link href={"/tracker/mine/"+encodeURIComponent(item.publicId)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">{item.publicId}</Link>
        <p className="mt-1 text-sm text-body">{item.issueType} · {item.status}</p>
        <p className="mt-1 break-words text-sm text-body">{item.description}</p>
      </li>)}</ul>}
  </section>;
}
