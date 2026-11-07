import {CollegeRetentionInlinePreview} from "@/components/placements/college-retention-inline-preview";
import { redirect } from "next/navigation";
import {EmptyState} from "@/components/ui/empty-state";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PlacementOperationsWorkspace } from "@/components/placements/placement-operations-workspace";
import {CollegeDriveAttentionCards} from "@/components/placements/college-drive-attention-cards";
import {getCollegeDriveAttention} from "@/modules/placements/college-drive-attention-service";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { resolveOptionalModuleAccess } from "@/modules/module-access/service";
import { StatTile } from "@/components/ui/stat-tile";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listCollegeDrives } from "@/modules/placements/college-drive-read-service";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

export default async function CollegePlacementsPage({searchParams}:{
  searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Placement Drives"/>
    <EmptyState title="Admin not assigned to a college" description="You must be assigned to a college to view and manage jobs. Contact your administrator."/>
  </div>;
  if (!hasMembershipRole(context,"COLLEGE_ADMIN")) redirect("/dashboard");
  const moduleAccess = await resolveOptionalModuleAccess(context);
  if (!moduleAccess.placements.enabled) return (
    <section role="status" className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader title="Placements is switched off for this college" />
      <Alert tone="info" title="Placements module unavailable">
        Placement drives, applications and interview actions are unavailable
        while Placements is disabled for your college. Existing records remain
        unchanged. Ask your Super Admin to enable Placements.
      </Alert>
      <TextLink href="/college/module-access"
        className="inline-flex min-h-11 items-center md:min-h-9">
        View college module access
      </TextLink>
    </section>
  );
  const incoming=await searchParams;
  const rawSearch=incoming["q"];
  if(Array.isArray(rawSearch)||(typeof rawSearch==="string"&&rawSearch.length>100))
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Placement Drives"/>
      <Alert tone="warning">Invalid search. <TextLink href="/college/placements">Clear search</TextLink></Alert>
    </div>;
  const q=typeof rawSearch==="string"?rawSearch.trim():"";
  const rawReturnTo=incoming["returnTo"];
  const returnTo=typeof rawReturnTo==="string"&&
    rawReturnTo.startsWith("/college/")&&!rawReturnTo.startsWith("//")
    ?rawReturnTo:"";
  const filteredHref="/college/placements/drives?status=PUBLISHED"+
    (q?"&q="+encodeURIComponent(q):"")+
    (returnTo?"&returnTo="+encodeURIComponent(returnTo):"");
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
        description="Run active hiring drives from one operational view. Attention items surface decisions that need action; closed and draft drives remain available in the full archive."
        actions={
          <div className="flex flex-wrap items-center gap-2">
           <ButtonLink variant="primary"
            href="/college/placements/new"
            className="w-full md:w-auto"
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
             <path d="M12 5v14M5 12h14"/>
            </svg>
            <span className="ml-1">New drive</span>
           </ButtonLink>
           <ButtonLink variant="secondary" href="/college/placements/drives">
            Browse all drives ({all?.total??"—"})
           </ButtonLink>
          </div>
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
        <TextLink href="/college/placements" className="ml-2">Retry</TextLink>
      </Alert>:null}

      {!attention?<Alert tone="warning">
        Couldn&apos;t check for anything that needs attention.
        <TextLink href="/college/placements" className="ml-2">Retry</TextLink>
      </Alert>:null}
      <section aria-label="Needs attention" className="min-w-0 space-y-2">
       <Heading level={2} size="lg" className="text-[var(--lms-heading)]">Needs attention</Heading>
       {attention?<div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-warning-border)] bg-[var(--lms-warning-subtle)] p-3">
        <CollegeDriveAttentionCards data={attention}/>
       </div>:null}
      </section>
      <section aria-label="Active drives" className="min-w-0 space-y-3">
        <Heading level={2} size="lg" className="text-[var(--lms-heading)]">Active drives</Heading>
        <form method="get" role="search" aria-label="Search active drives"
          className="flex min-w-0 flex-wrap items-end gap-2 sm:justify-between">
          <Label stack className="min-w-0 w-full sm:w-[240px]">
            <span className="sr-only">Search by drive or company</span>
            <Input type="search" name="q" maxLength={100} defaultValue={q}
             placeholder="Search by drive or company"/>
          </Label>
          {returnTo?<input type="hidden" name="returnTo" value={returnTo}/>:null}
          <Button type="submit" className="min-h-11 md:min-h-9">Search</Button>
          {q?<TextLink href={"/college/placements"+(returnTo?"?returnTo="+encodeURIComponent(returnTo):"")}
            className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:null}
          <ButtonLink variant="primary" href="/college/placements/new"
           className="ml-auto">
           <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
           </svg><span className="ml-1">New Drive</span>
          </ButtonLink>
        </form>
        {filtered?<DataTable caption="Active college drives" rows={activeRows} getRowKey={row=>row.id}
          empty={<EmptyState title="No active drives" description="No published drives match your search."
            action={<TextLink href={filteredHref}>View all drives</TextLink>}/>}
          columns={[
            {key:"title",header:"Drive",mobilePriority:"primary",cell:row=>
              <TextLink href={"/college/placements/jobs/"+encodeURIComponent(row.id)+"/overview"}>{row.title}</TextLink>},
            {key:"company",header:"Company",cell:row=>row.companyName},
            {key:"status",header:"Status",cell:row=>
              <StatusBadge tone={row.status==="PUBLISHED"?"success":"neutral"}>
                {row.status==="PUBLISHED"?"Active":row.status}</StatusBadge>},
            {key:"actions",header:"Actions",cell:row=>
              <TextLink href={"/college/placements/jobs/"+encodeURIComponent(row.id)+"/applications"}>Applications</TextLink>},
          ]}/>:null}
        {filtered?<p className="text-xs text-muted-foreground">
          Showing up to {activeRows.length} of {filtered.total} matching active drives.
          <TextLink href={filteredHref}
            className="ml-2">View all</TextLink>
        </p>:null}
      </section>
      <nav aria-label="Placement workspaces" className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] sm:flex-row sm:flex-wrap">
      <ButtonLink variant="secondary" href="/college/placements/interviews" className="w-full sm:w-auto">Interviews</ButtonLink>
      <ButtonLink variant="secondary" href="/college/placements/drives" className="w-full sm:w-auto">All drives ({draft&&closed?draft.total+closed.total:"—"} closed / draft)</ButtonLink>
      </nav>

      <CollegeRetentionInlinePreview/>
      <p className="border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
        <TextLink href="/college/placements/student-lookup">Student placement lookup</TextLink>
        <span className="ml-2 text-xs text-muted-foreground">Search a student by name, roll number or email to see recorded applications, offers and joining outcomes.</span>
        <TextLink href="/college/students" className="ml-3">Student directory</TextLink>
      </p>
      <PlacementOperationsWorkspace
        context={context}
        collegeId={context.membership.collegeId}
        basePath="/college/placements"
      />
    </div>
  );
}
