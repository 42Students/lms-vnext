import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import { tpoCrmTablesReady } from "@/modules/placements/tpo-crm-storage-readiness";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
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
  const scope=(Array.isArray(raw.scope)?raw.scope[0]:raw.scope)==="MINE"?"MINE":"TEAM";
  const window=(Array.isArray(raw.window)?raw.window[0]:raw.window)==="NEXT_7_DAYS"?"NEXT_7_DAYS":"DUE";
  const q=(Array.isArray(raw.q)?raw.q[0]:raw.q)?.trim().slice(0,100)??"";
  const inputPage=Array.isArray(raw.page)?raw.page[0]:raw.page;
  const page=inputPage&&/^[1-9]\d{0,3}$/.test(inputPage)?Number(inputPage):1;
  const ready = await tpoCrmTablesReady();
  const data = ready ? await getTpoDueFollowupQueue(context,undefined,{scope,window,q,page}) : null;
  return (
    <div className="space-y-6">
      <Link href="/tpo/recruiters"
        className="text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline">
        ← Back to recruiter leads
      </Link>
      <PageHeader eyebrow="TPO · Recruiter relationships" title="Follow-ups due"
        description="Schedule recruiter follow-ups and log completed outcomes using registered CRM data." />
      <nav aria-label="Follow-up ownership" className="flex flex-wrap gap-3">
        {FOLLOWUP_SCOPES.map(view=><Link key={view} href={tpoFollowupQueueHref({scope:view,window,q})}
          aria-current={view===scope?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">
          {view==="MINE"?"My Work":"Placement Team"}
        </Link>)}
      </nav>
      <nav aria-label="Follow-up date window" className="flex flex-wrap gap-3">
        {FOLLOWUP_WINDOWS.map(view=><Link key={view} href={tpoFollowupQueueHref({scope,window:view,q})}
          aria-current={view===window?"page":undefined}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">
          {view==="DUE"?"Due now":"Next 7 days"}
        </Link>)}
      </nav>
      <form action="/tpo/follow-ups" method="get" className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
        <input type="hidden" name="scope" value={scope}/><input type="hidden" name="window" value={window}/>
        <label className="min-w-0 flex-1 text-sm font-semibold text-body">Find recruiter or company
          <Input type="search" name="q" maxLength={100} defaultValue={q} placeholder="Search recorded lead or company name"
            className="mt-1 min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground"/>
        </label><Button type="submit" className="min-h-[var(--lms-control-height)]">Search</Button>
        {q?<Link href={tpoFollowupQueueHref({scope,window})} className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)]">Clear</Link>:null}
      </form>
      <p className="text-sm text-body">{scope==="MINE"?"Only open due follow-ups assigned to your persisted TPO membership.":"Open due follow-ups for the placement team; this includes all owners."}</p>
      {data ? <><a href={tpoFollowupQueueExportHref({scope,window,q})}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 text-sm font-[650] text-on-primary">
          Export filtered follow-ups CSV
        </a><TpoDueFollowupWorkspace data={data} />
        <nav aria-label="Follow-up pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span className="text-body">Showing {data.total===0?0:(data.page-1)*data.pageSize+1}–{Math.min(data.total,data.page*data.pageSize)} of {data.total} matching tasks · page {data.page} of {data.totalPages}</span>
          <div className="flex gap-4">{data.page>1?<Link href={tpoFollowupQueueHref({scope,window,q,page:data.page-1})} className="font-semibold text-[var(--lms-teal-deep)]">← Previous</Link>:null}
            {data.page<data.totalPages?<Link href={tpoFollowupQueueHref({scope,window,q,page:data.page+1})} className="font-semibold text-[var(--lms-teal-deep)]">Next →</Link>:null}</div>
        </nav></> : (
        <section role="status" className="border-t border-border py-6">
          <h2 className="font-semibold text-foreground">Recruiter follow-ups unavailable</h2>
          <p className="mt-2 text-sm text-body">
            DB09 must be verified before recruiter follow-ups can be loaded or changed.
            Unavailable records are not counted as zero.
          </p>
        </section>
      )}
    </div>
  );
}
