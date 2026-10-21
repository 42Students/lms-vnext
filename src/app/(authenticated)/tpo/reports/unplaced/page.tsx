import { Input } from "@/components/ui/input";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {tpoReportHasAmbiguousFilters} from "@/modules/placements/tpo-report-url-guard";
import {TpoReportInvalidFilters} from "@/components/placements/tpo-report-invalid-filters";
import { Alert } from "@/components/ui/alert";
import { Disclosure } from "@/components/ui/disclosure";
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
  try {
  const workspace = await getPlacementReportDetails(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(query.seasonId) || undefined,
    jobId: first(query.jobId) || undefined,
  });

  // A broken batch-options fetch must not hide the already-authorized
  // report. If a batch was selected, fail the dependent filter closed.
  const batches=await listTpoBatches(context).catch(()=>null);
  const batchesUnavailable=batches===null;
  const batchId=first(query.batchId)||undefined,branchId=first(query.branchId)||undefined;
  const permittedBatch=!batchId||Boolean(batches?.batches.some(batch=>batch.id===batchId));
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
  // Legacy Ready/Unplaced requires all facts together: a registration in
  // Placements, a resume, a recorded CGPA, 10th percentage, and no accepted
  // placement offer. Unknown evidence never becomes a synthetic pass.
  const readyUnplaced=unplaced.filter(learner=>{
   const row=rowsById.get(learner.membershipId);
   return row?.registeredForPlacements===true &&
    row.profileFacts?.resume===true &&
    row.cgpa!==null&&row.cgpa!==undefined &&
    row.tenthPct!==null&&row.tenthPct!==undefined &&
    !row.placed;
  });
  const branches=[...new Map((intelligence?.branches??[]).map(row=>[row.branchId,row.branchName]))];
  const exportParams=new URLSearchParams({
   ...(workspace.selectedSeasonId?{seasonId:workspace.selectedSeasonId}:{}),
   ...(workspace.selectedJobId?{jobId:workspace.selectedJobId}:{}),
   ...(batchId?{batchId}:{}),...(branchId?{branchId}:{}),
  });
  const filteredExportHref="/api/placements/tpo/reports/unplaced?"+exportParams.toString();
  return (
    <div data-tpo-presentation-report className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Unplaced students"
        description="Current registered placement-pool learners with no accepted offer in the selected reporting scope."
        actions={permittedBatch&&permittedBranch?<a href={filteredExportHref} className="inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link lms-inline-link">Download filtered CSV</a>:null}
      />

      <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] min-[768px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
       {workspace.selectedSeasonId?<Input type="hidden" name="seasonId" value={workspace.selectedSeasonId}/>:null}
       {workspace.selectedJobId?<Input type="hidden" name="jobId" value={workspace.selectedJobId}/>:null}
       <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
        <Select name="batchId" defaultValue={batchId??""} className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">
         <option value="">All current batches</option>
         {(batches?.batches??[]).map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
        </Select></label>
       <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Branch
        <Select name="branchId" defaultValue={branchId??""} className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]">
         <option value="">All branches</option>{branches.map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </Select></label>
       <Button type="submit" className="min-h-11 w-full min-[768px]:min-h-[var(--lms-control-height)] min-[768px]:w-auto">Filter</Button>
      </form>
      {(batchId||branchId)?<Link href="/tpo/reports/unplaced" className="inline-flex min-h-11 items-center text-sm text-link underline lms-inline-link min-[768px]:min-h-[var(--lms-control-height)]">Clear batch and branch</Link>:null}
      {batchesUnavailable?<Alert tone="warning">
        Could not load batches. The report remains available without batch-specific filtering.
        <Link href="/tpo/reports/unplaced" className="ml-2 text-link underline">Retry batches</Link>
      </Alert>:null}
      {!permittedBatch?<Alert tone="error">{batchesUnavailable
       ?"Selected batch could not be verified; no batch-specific student records were loaded."
       :"The selected batch does not belong to this college."}</Alert>:null}
      {!permittedBranch?<Alert tone="error">The selected branch does not belong to this college or batch. <Link href="/tpo/reports/unplaced" className="text-link underline lms-inline-link">Clear filters</Link></Alert>:null}
      <SummaryStrip label="Unplaced learner report summary" steps={[
        {label:"Unplaced in selected scope",value:reportNumber(unplaced.length)},
        {label:"Ready, unplaced",value:reportNumber(readyUnplaced.length),
         note:"Registered in placements; resume uploaded, CGPA and 10th marks recorded; no accepted offer. Unverified or missing facts are excluded."},
        {label:"Current placement-pool registrations",
          value:reportNumber(workspace.report.metrics.registered),
          note:"See Placement Summary for the overall registered denominator."},
      ]}/>

      <div className="border-b border-border py-4">
       <Link href={tpoUnplacedStudentsHref({batchId,branchId})}
        className="inline-flex min-h-11 min-[768px]:min-h-[var(--lms-control-height)] items-center font-semibold text-link underline">
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
          academic.get(learner.membershipId)?.verification??"Not recorded",
          row?.profileFacts?.resume===true?"Uploaded":
           row?.profileFacts?.resume===false?"Missing":"Not confirmed",
          lastApplications.get(learner.membershipId)?.applications??0,
          lastApplications.get(learner.membershipId)?.stillInDrive?"Yes":"No",
          lastApplications.get(learner.membershipId)?.lastSubmittedAt?.toLocaleDateString("en-IN",{timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric"})??"Not recorded"];
        })}
        emptyDescription="No unplaced learners match this reporting scope. This does not prove that all learners have been placed across all seasons."
        compactControls
      />
      <Disclosure title="Report filters and information" className="min-w-0" contentClassName="min-w-0 space-y-[var(--lms-space-4)] pt-[var(--lms-space-2)]">
        <ReportFilters workspace={workspace} userId={context.user.id} path="/tpo/reports/unplaced" />
      <p className="text-xs text-muted-foreground">The download uses the selected season, drive, batch and branch. Changing the season/drive control below may reset the batch/branch filter; reapply it before downloading if needed.</p>
      <p className="text-xs text-muted-foreground">Applications and last-applied dates use the selected season and drive. Academic marks use authorized college evidence. Resume Uploaded/Missing reflects the learner profile record; Not confirmed means no authoritative resume status is available.</p>


        <ReportScopeNote note={workspace.detailScopeNote} />
      </Disclosure>
      <ReportNavigation workspace={workspace} compactNavigation />
    </div>
  );
  }catch{
   return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="TPO · Reports" title="Unplaced students"
      description="Review the current college-scoped unplaced report."/>
    <Alert tone="error">
     <strong>Could not load the report</strong>
     <p className="mt-2 text-sm">The previous report data has not been replaced with a false zero or an empty result.</p>
     <Link href="/tpo/reports/unplaced" className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline">Retry</Link>
    </Alert>
   </div>;
  }
}
