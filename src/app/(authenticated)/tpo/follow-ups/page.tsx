import { Pagination } from "@/components/ui/pagination";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { TpoDueFollowupWorkspace } from "@/components/tpo/tpo-due-followup-workspace";
import { getTpoDueFollowupQueue } from "@/modules/placements/tpo-followup-queue-service";
import { tpoFollowupQueueHref,tpoFollowupQueueExportHref } from "@/modules/placements/tpo-followup-queue-model";

export const dynamic = "force-dynamic";
const FOLLOWUP_SCOPES=["MINE","TEAM"] as const;
const FOLLOWUP_WINDOWS=["DUE","NEXT_7_DAYS"] as const;

export default async function TpoFollowupQueuePage({searchParams}:{searchParams:Promise<{scope?:string|string[];window?:string|string[];q?:string|string[];page?:string|string[]}>}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const raw=await searchParams;
  // Reject ambiguous repeated keys rather than choosing an arbitrary value.
  if ([raw.scope, raw.window, raw.q, raw.page].some(Array.isArray)) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Follow-ups due" />
      <Alert tone="error">Invalid follow-up filters. <Link href="/tpo/follow-ups">Clear filters</Link></Alert>
    </div>;
  }
  const scope=(Array.isArray(raw.scope)?raw.scope[0]:raw.scope)==="MINE"?"MINE":"TEAM";
  const window=(Array.isArray(raw.window)?raw.window[0]:raw.window)==="NEXT_7_DAYS"?"NEXT_7_DAYS":"DUE";
  const q=(Array.isArray(raw.q)?raw.q[0]:raw.q)?.trim().slice(0,100)??"";
  const inputPage=Array.isArray(raw.page)?raw.page[0]:raw.page;
  const page=inputPage&&/^[1-9]\d{0,3}$/.test(inputPage)?Number(inputPage):1;
  const ready = await tpoCrmTablesReady();
  const data = ready ? await getTpoDueFollowupQueue(context,undefined,{scope,window,q,page}) : null;
  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader eyebrow="TPO · Recruiter relationships" title="Follow-ups due"
        description="Schedule recruiter follow-ups and log completed outcomes using registered CRM data."
        actions={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {data ? <a href={tpoFollowupQueueExportHref({scope,window,q})}
            className="lms-inline-link inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Export filtered follow-ups CSV</a> : null}
          <Link href="/tpo/recruiters" className="lms-inline-link inline-flex min-h-11 items-center justify-center px-2 text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">← Back to recruiter leads</Link>
        </div>}
      />
      <div className="grid min-w-0 gap-3 md:grid-cols-2 md:items-start">
      <nav aria-label="Follow-up ownership" className="flex min-w-0 flex-wrap gap-2">
        {FOLLOWUP_SCOPES.map(view=><Link key={view} href={tpoFollowupQueueHref({scope:view,window,q})}
          aria-current={view===scope?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)] hover:bg-[rgba(38,186,199,0.07)] aria-[current=page]:border-[var(--lms-primary)] aria-[current=page]:bg-[var(--lms-primary-subtle)] aria-[current=page]:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          {view==="MINE"?"My Work":"Placement Team"}
        </Link>)}
      </nav>
      <nav aria-label="Follow-up date window" className="flex min-w-0 flex-wrap gap-2">
        {FOLLOWUP_WINDOWS.map(view=><Link key={view} href={tpoFollowupQueueHref({scope,window:view,q})}
          aria-current={view===window?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)] hover:bg-[rgba(38,186,199,0.07)] aria-[current=page]:border-[var(--lms-primary)] aria-[current=page]:bg-[var(--lms-primary-subtle)] aria-[current=page]:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
          {view==="DUE"?"Due now":"Next 7 days"}
        </Link>)}
      </nav>
      </div>
      <form action="/tpo/follow-ups" method="get" className="grid min-w-0 grid-cols-1 gap-3 border-t border-border pt-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <input type="hidden" name="scope" value={scope}/><input type="hidden" name="window" value={window}/>
        <label className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Find recruiter or company
          <Input type="search" name="q" maxLength={100} defaultValue={q} placeholder="Search recorded lead or company name"
            className="mt-[6px] min-h-11 w-full border border-border px-3"/>
        </label><Button type="submit" className="min-h-11 w-full sm:w-auto">Search</Button>
        {q?<Link href={tpoFollowupQueueHref({scope,window})} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)]">Clear</Link>:null}
      </form>
      <p className="text-sm text-body leading-[22px]">{scope==="MINE"?"Only open due follow-ups assigned to your persisted TPO membership.":"Open due follow-ups for the placement team; this includes all owners."}</p>
      {data ? <><TpoDueFollowupWorkspace data={data} />
        <div className="flex min-w-0 flex-col gap-3 border-t border-border pt-3 text-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"><span className="text-body">Showing {(data.total===0?0:(data.page-1)*data.pageSize+1).toLocaleString("en-IN")}–{Math.min(data.total,data.page*data.pageSize).toLocaleString("en-IN")} of {data.total.toLocaleString("en-IN")} matching tasks · page {data.page} of {data.totalPages}</span>{data.totalPages > 1 ? <Pagination label="Follow-up pages" page={data.page} pageCount={data.totalPages} hrefForPage={page=>tpoFollowupQueueHref({scope,window,q,page})}/> : null}</div></> : (
        <Alert tone="warning" className="border-t border-border">
          <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Recruiter follow-ups unavailable</h2>
          <p className="mt-2 text-sm text-body leading-[22px]">
            DB09 must be verified before recruiter follow-ups can be loaded or changed.
            Unavailable records are not counted as zero.
          </p>
        </Alert>
      )}
    </div>
  );
}
