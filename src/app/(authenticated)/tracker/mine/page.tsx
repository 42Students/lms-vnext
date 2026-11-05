import { StatusBadge } from "@/components/ui/status-badge";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import {trackerAdminRuntimeEnabled} from "@/modules/bug-tracker/readiness";
import {listMyTrackerReports} from "@/modules/bug-tracker/reporter-service";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
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
      action={<TextLink href="/tracker/mine" className="inline-flex min-h-11 items-center md:min-h-9">Retry</TextLink>} />
  </div>;}
  return <section className="min-w-0 max-w-full space-y-6">
    <PageHeader title="My reports" description="See the issues you have reported."
      actions={<ButtonLink variant="primary" href="/tracker" className="w-full md:w-auto">Report an issue</ButtonLink>}/>
    {!reports.length?<EmptyState title="No reports yet" description="You have not reported any issues yet." action={<ButtonLink variant="primary" href="/tracker">Report an issue</ButtonLink>}/>:
      <ul className="min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{reports.map(item=><li key={item.publicId}
        className="min-w-0 py-[var(--lms-space-3)]">
        <TextLink href={"/tracker/mine/"+encodeURIComponent(item.publicId)}
          className="inline-flex min-h-11 min-w-0 items-center break-all md:min-h-9">{item.publicId}</TextLink>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] text-sm text-body"><span className="break-words">{item.issueType}</span><StatusBadge>{item.status}</StatusBadge></div>
        <p className="mt-1 max-w-3xl break-words [overflow-wrap:anywhere] text-sm leading-6 text-body">{item.description}</p>
      </li>)}</ul>}
  </section>;
}
