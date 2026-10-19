import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Skeleton } from "@/components/ui/skeleton";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import {
  ReportFilters,
  ReportNavigation,
  ReportScopeNote,
  ReportTable,
  reportNumber,
} from "@/components/placements/placement-report-ui";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementReportDetails } from "@/modules/placements/report-service";
import {tpoUnplacedStudentsHref} from "@/modules/placements/tpo-unplaced-students-link";
import {getTpoUnplacedAcademicEvidence} from "@/modules/placements/tpo-unplaced-academic-evidence-service";
import {formatUnplacedPercentage} from "@/modules/placements/tpo-unplaced-academic-evidence-model";
import {getTpoUnplacedLastApplications} from "@/modules/placements/tpo-unplaced-activity-read-service";
import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import Link from "next/link";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
  batchId?:string|string[];
  branchId?:string|string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoUnplacedReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();

  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  const query = await searchParams;
  if(tpoReportHasAmbiguousFilters(query))return <TpoReportInvalidFilters path="/tpo/reports/unplaced"/>;
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  const batches=await listTpoBatches(context);
  const batchId=first(query.batchId)||undefined,branchId=first(query.branchId)||undefined;
  const permittedBatch=!batchId||batches.batches.some(batch=>batch.id===batchId);
  const intelligence=permittedBatch?await getTpoStudentsIntelligence(context,{
    collegeId:context.membership.collegeId,...(batchId?{batchId}:{}),...(branchId?{branchId}:{}),
    page:1,pageSize:100,
  },{includeExportRows:true}):null;
  const permittedBranch=!branchId||(intelligence?.branches??[]).some(item=>item.branchId===branchId);
  const lastApplications=permittedBatch&&permittedBranch?
   await getTpoUnplacedLastApplications(context,{
    collegeId:context.membership.collegeId,seasonId:workspace.selectedSeasonId,
    jobId:workspace.selectedJobId,
   }):new Map<string,{lastSubmittedAt:Date|null;applications:number;stillInDrive:boolean}>();
  const rowsById=new Map(permittedBranch?intelligence?.exportRows?.map(row=>[row.membershipId,row])??[]:[]);
  const unplaced=workspace.details.unplaced.filter(learner=>rowsById.has(learner.membershipId));
  const academic=await getTpoUnplacedAcademicEvidence(context,context.membership.collegeId,unplaced.map(item=>item.membershipId));
  const branches=[...new Map((intelligence?.branches??[]).map(row=>[row.branchId,row.branchName]))];
  const exportParams=new URLSearchParams({
   ...(workspace.selectedSeasonId?{seasonId:workspace.selectedSeasonId}:{}),
   ...(workspace.selectedJobId?{jobId:workspace.selectedJobId}:{}),
   ...(batchId?{batchId}:{}),...(branchId?{branchId}:{}),
  });
  const filteredExportHref="/api/placements/tpo/reports/unplaced?"+exportParams.toString();
  return (
    <div data-tpo-presentation-report className="space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Unplaced students"
        description="Current registered placement-pool learners with no accepted offer in the selected reporting scope."
        actions={permittedBatch&&permittedBranch?<a href={filteredExportHref} className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link">Download filtered CSV</a>:null}
      />

      <Suspense fallback={<Skeleton variant="form" />}><TpoReportSavedFilters path="/tpo/reports/unplaced" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <TpoReportPresentation />
      <ReportNavigation workspace={workspace} />
      <form method="get" className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
       {workspace.selectedSeasonId?<input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
       {workspace.selectedJobId?<input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
       <label className="grid gap-1 text-sm">Batch
        <Select name="batchId" defaultValue={batchId??""} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border px-3">
         <option value="">All current batches</option>
         {batches.batches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </Select></label>
       <label className="grid gap-1 text-sm">Branch
        <Select name="branchId" defaultValue={branchId??""} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border px-3">
         <option value="">All branches</option>{branches.map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </Select></label>
       <Button type="submit" className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-on-primary">Filter</Button>
       {(batchId||branchId)?<Link href="/tpo/reports/unplaced" className="inline-flex min-h-11 sm:min-h-9 items-center text-link underline lms-inline-link">Clear batch and branch</Link>:null}
       <Link href={tpoUnplacedStudentsHref({batchId,branchId})}
        className="inline-flex min-h-11 sm:min-h-9 items-center text-link underline">Act on them on Students</Link>
      </form>
      {!permittedBatch?<p role="alert">The selected batch does not belong to this college.</p>:null}
      {!permittedBranch?<p role="alert">The selected branch does not belong to this college or batch. <Link href="/tpo/reports/unplaced" className="text-link underline lms-inline-link">Clear filters</Link></p>:null}
      <p className="text-xs text-muted-foreground">The download uses the selected season, drive, batch and branch. Changing the season/drive control below may reset the batch/branch filter; reapply it before downloading if needed.</p>
      <p className="text-xs text-muted-foreground">Applications and last-applied dates use the selected season and drive. Academic marks and resume verification require authoritative evidence and are shown as unavailable when not stored.</p>
      <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/unplaced" />

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-body">
            Unplaced in selected scope
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {reportNumber(unplaced.length)}
          </p>
        </div>
        <div className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
          <p className="text-xs font-semibold uppercase text-body">
            Current placement-pool registrations
          </p>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
            {reportNumber(workspace.report.metrics.registered)}
          </p>
          <p className="mt-1 text-xs text-body">
            See Placement Summary for the overall registered denominator.
          </p>
        </div>
      </section>

      <ReportScopeNote note={workspace.detailScopeNote} />
      <div className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
       <Link href={tpoUnplacedStudentsHref({batchId,branchId})}
        className="inline-flex min-h-11 sm:min-h-9 items-center font-semibold text-link underline">
        Act on them on Students
       </Link>
       <p className="mt-2 text-xs text-muted-foreground">
        The Students view shows readiness and applications. This shortcut targets ready students
        who have not applied; it is not an exhaustive filter of every unplaced student.
       </p>
      </div>

      <ReportTable
        title="Registered learners without an accepted offer"
        headings={["Student","Roll no.","Batch","Branch","Lowest %","UG %","Marks verified","Resume","Applications","Still in a drive","Last applied"]}
        rows={unplaced.map(learner=>{
         const row=rowsById.get(learner.membershipId);
         return [learner.displayName,row?.rollNumber??"—",row?.cohortName??"—",
          learner.departmentName,
          formatUnplacedPercentage(academic.get(learner.membershipId)?.lowestRecordedPercent??null),
          formatUnplacedPercentage(academic.get(learner.membershipId)?.undergraduatePercent??null),
          academic.get(learner.membershipId)?.verification??"Not recorded","Not confirmed",
          lastApplications.get(learner.membershipId)?.applications??0,
          lastApplications.get(learner.membershipId)?.stillInDrive?"Yes":"No",
          lastApplications.get(learner.membershipId)?.lastSubmittedAt?.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric"})??"Not recorded"];
        })}
        emptyDescription="No unplaced learners match this reporting scope. This does not prove that all learners have been placed across all seasons."
      />
    </div>
  );
}
