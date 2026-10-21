import Link from "next/link";
import { redirect } from "next/navigation";
import {EmptyState} from "@/components/ui/empty-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import {CollegeDriveAttentionCards} from "@/components/placements/college-drive-attention-cards";
import {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { Disclosure } from "@/components/ui/disclosure";
import { StatTile } from "@/components/ui/stat-tile";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeDrives } from "@/modules/placements/college-drive-read-service";

export default async function CollegePlacementsPage({searchParams}:{
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Placement Drives"/>
    <EmptyState title="Admin not assigned to a college" description="Contact your college administrator to request access to placement drives."/>
  </div>;
  if (!hasMembershipRole(context,"COLLEGE_ADMIN")) redirect("/dashboard");
  const incoming=await searchParams;
  const rawSearch=incoming.q;
  if(Array.isArray(rawSearch)||(typeof rawSearch==="string"&&rawSearch.length>100))
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Placement Drives"/>
      <Alert tone="warning">Invalid search. <Link href="/college/placements"
        className="font-semibold text-link underline">Clear search</Link></Alert>
    </div>;
  const q=typeof rawSearch==="string"?rawSearch.trim():"";
  const [attentionResult,allResult,activeResult,draftResult,closedResult,filteredResult] =
    await Promise.allSettled([
      getCollegeDriveAttention(context),
      listCollegeDrives(context,{status:"ALL"}),
      listCollegeDrives(context,{status:"PUBLISHED"}),
      listCollegeDrives(context,{status:"DRAFT"}),
      listCollegeDrives(context,{status:"CLOSED"}),
      listCollegeDrives(context,{status:"PUBLISHED",q}),
    ]);
  for(const r of [attentionResult,allResult,activeResult,draftResult,closedResult,filteredResult]){
    if(r.status==="rejected"&&r.reason instanceof AuthorizationError)throw r.reason;
  }
  const attention=attentionResult.status==="fulfilled"?attentionResult.value:null;
  const all=allResult.status==="fulfilled"?allResult.value:null;
  const active=activeResult.status==="fulfilled"?activeResult.value:null;
  const draft=draftResult.status==="fulfilled"?draftResult.value:null;
  const closed=closedResult.status==="fulfilled"?closedResult.value:null;
  const filtered=filteredResult.status==="fulfilled"?filteredResult.value:null;
  const activeRows=filtered?.items??[];
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        title="Placement Drives"
        description="Placement operations inside your active college membership."
        actions={
          <Link
            href="/college/placements/new"
            className="inline-flex min-h-11 w-full items-center justify-center md:min-h-[var(--lms-control-height)] md:w-auto rounded-[var(--lms-control-radius)] border border-primary bg-primary px-3 text-sm font-semibold text-on-primary motion-safe:transition-colors hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] active:border-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
          >
            New drive
          </Link>
        }
      />
      <section aria-label="Placement drive totals" className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Active drives" value={active?.total??"Unavailable"}/>
        <StatTile label="Needs attention" value={attention?.total??"Unavailable"}/>
        <StatTile label="Closed / draft" value={draft&&closed?draft.total+closed.total:"Unavailable"}/>
        <StatTile label="All drives" value={all?.total??"Unavailable"}/>
      </section>
      {!filtered?<Alert tone="warning">
        Couldn&apos;t load drives. Check your connection and retry.
        <Link href="/college/placements" className="ml-2 font-semibold text-link underline">Retry</Link>
      </Alert>:null}
      {!attention?<Alert tone="warning">
        Couldn&apos;t check for anything that needs attention.
        <Link href="/college/placements" className="ml-2 font-semibold text-link underline">Retry</Link>
      </Alert>:null}
      <section aria-label="Active drives" className="min-w-0 space-y-3">
        <h2 className="text-[18px] font-semibold text-[var(--lms-heading)]">Active drives</h2>
        <form method="get" role="search" aria-label="Search active drives"
          className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
          <label className="grid min-w-0 flex-1 gap-1 text-sm font-semibold">
            Search by drive or company
            <Input type="search" name="q" maxLength={100} defaultValue={q}/>
          </label>
          <Button type="submit" className="min-h-11 md:min-h-9">Search</Button>
          {q?<Link href="/college/placements" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>:null}
        </form>
        {filtered?<DataTable caption="Active college drives" rows={activeRows} getRowKey={row=>row.id}
          columns={[
            {key:"title",header:"Drive",mobilePriority:"primary",cell:row=>
              <Link href={"/college/placements/jobs/"+encodeURIComponent(row.id)+"/overview"}
                className="font-semibold text-link underline">{row.title}</Link>},
            {key:"company",header:"Company",cell:row=>row.companyName},
            {key:"status",header:"Status",cell:row=>
              <StatusBadge tone={row.status==="PUBLISHED"?"success":"neutral"}>
                {row.status==="PUBLISHED"?"Active":row.status}</StatusBadge>},
            {key:"actions",header:"Actions",cell:row=>
              <Link href={"/college/placements/jobs/"+encodeURIComponent(row.id)+"/applications"}
                className="font-semibold text-link underline">Applications</Link>},
          ]}/>:null}
        {filtered?<p className="text-xs text-muted-foreground">
          Showing up to {activeRows.length} of {filtered.total} matching active drives.
          <Link href={"/college/placements/drives"+(q?"?status=PUBLISHED&q="+encodeURIComponent(q):"?status=PUBLISHED")}
            className="ml-2 font-semibold text-link underline">View all</Link>
        </p>:null}
      </section>
      <nav aria-label="Placement workspaces" className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] sm:flex-row sm:flex-wrap">
      <Link href="/college/placements/interviews" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link sm:w-auto md:min-h-[var(--lms-control-height)] hover:bg-[rgba(38,186,199,0.07)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Interviews</Link>
      <Link href="/college/placements/drives" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link sm:w-auto md:min-h-[var(--lms-control-height)] hover:bg-[rgba(38,186,199,0.07)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">All drives</Link>
      </nav>
      {attention?<Disclosure title={"Drive attention and quick view ("+attention.total+")"}
        defaultOpen={attention.total>0} className="min-w-0">
        <CollegeDriveAttentionCards data={attention}/>
      </Disclosure>:null}
      <Disclosure title="Data retention report" className="min-w-0">
        <div className="min-w-0 space-y-2 py-3">
          <Alert tone="info">
            A verified 180-day college-scoped retention report has not been enabled.
            No stale-drive counts or 200-row samples are inferred from creation dates.
          </Alert>
          <Link href="/college/placements/drives"
            className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
            Review all drives
          </Link>
        </div>
      </Disclosure>
      <p className="border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
        <Link href="/college/students" className="font-semibold text-link underline">Student directory</Link>
        <span className="ml-2 text-xs text-muted-foreground">Student placement history lookup is not yet available; no outcome is inferred.</span>
      </p>
      <PlacementOperationsWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        basePath="/college/placements"
      />
    </div>
  );
}
