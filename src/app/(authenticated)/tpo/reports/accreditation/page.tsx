import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {getPlacementAccreditationReport} from "@/modules/placements/report-accreditation-service";
import {getTpoAccreditationStudentExport} from "@/modules/placements/tpo-accreditation-students-service";
import {listTpoBatches} from "@/modules/placements/tpo-batch-workspace-read-service";
import {accreditationStudentCompleteness} from "@/modules/placements/tpo-accreditation-completeness";
import {accreditationPackageLpa,accreditationOfferStatusLabel,accreditationJoiningLabel} from "@/modules/placements/tpo-accreditation-students-model";

type SearchParams = {
  seasonId?: string | string[];
  jobId?: string | string[];
  batchId?: string | string[];
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TpoAccreditationReportPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  const params = await searchParams;
  const report = await getPlacementAccreditationReport(context, {
    collegeId: context.membership.collegeId,
    seasonId: first(params.seasonId) || undefined,
    jobId: first(params.jobId) || undefined,
  });

  const batches=await listTpoBatches(context);
  const batchId=first(params.batchId)||undefined;
  const selectedBatch=batchId?batches.batches.find(b=>b.id===batchId):undefined;
  const studentReport=selectedBatch?await getTpoAccreditationStudentExport(context,{
   collegeId:context.membership.collegeId,seasonId:report.selectedSeasonId??undefined,
   jobId:report.selectedJobId??undefined,batchId:selectedBatch.id,
  }):null;
  const completeness=studentReport?accreditationStudentCompleteness(studentReport.rows):null;
  const query=new URLSearchParams({kind:"accreditation-students"});
  if(selectedBatch)query.set("batchId",selectedBatch.id);
  if (report.selectedSeasonId) {
    query.set("seasonId", report.selectedSeasonId);
  }
  if (report.selectedJobId) {
    query.set("jobId", report.selectedJobId);
  }
  const overview = report.rows.filter(
    (row) => row[0] === "Overall" || row[0] === "Branch" || row[0] === "Company",
  );

  return (
    <div data-tpo-presentation-report className="space-y-6">
      <TpoReportPresentation />
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/accreditation" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <PageHeader
        eyebrow="TPO · Reports"
        title="Accreditation export"
        description={TPO_LEGACY_REPORT_COPY["/tpo/reports/accreditation"].description}
        actions={selectedBatch&&studentReport&&studentReport.rows.length>0?
          <a href={"/api/placements/reports?"+query.toString()}
           className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] text-white">
           Export student list CSV
          </a>:
          <span aria-disabled="true" role="status" className="inline-flex min-h-11 sm:min-h-9 cursor-not-allowed items-center rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle px-4 text-sm font-semibold text-muted-foreground">
           Export student list CSV — {selectedBatch?"No placed students":"Pick a batch first"}
          </span>
        }
      />
      <Link
        href="/tpo/reports"
        className="text-sm font-semibold text-link hover:underline"
      >
        ← All reports
      </Link>
      <section id="accreditation-batch" className="space-y-3 border-t border-border pt-5">
       <h2 className="font-semibold">NAAC 5.2.1 · Placed students</h2>
       <p role="status" className="text-sm">NAAC 5.2.1 lists the students of one batch. Pick the batch above.</p>
       <form method="get" className="flex flex-wrap items-end gap-3">
        <label className="text-sm">Batch
         <Select name="batchId" defaultValue={selectedBatch?.id??""} className="mt-1 block min-h-11 sm:min-h-9">
          <option value="">Pick a batch</option>
          {batches.batches.map(batch=><option key={batch.id} value={batch.id}>{batch.name}</option>)}
         </Select>
        </label>
        {report.selectedSeasonId&&<input type="hidden" name="seasonId" value={report.selectedSeasonId}/>}
        {report.selectedJobId&&<input type="hidden" name="jobId" value={report.selectedJobId}/>}
        <Button variant="secondary" type="submit" className="min-h-11 sm:min-h-9">Show students</Button>
       </form>
       {batchId&&!selectedBatch&&<p role="alert" className="text-sm">Choose a batch from this college.</p>}
       {selectedBatch&&studentReport?.rows.length===0?<p role="status" className="text-sm text-muted-foreground">No placed students in this batch. Export is unavailable until a recorded placement exists.</p>:null}
       {studentReport&&<>
        {completeness?<div aria-label="NAAC and NIRF completeness" className="space-y-2 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-4">
         <h3 className="font-semibold">{completeness.missingStudents} of {completeness.total} students are missing data NAAC/NIRF ask for</h3>
         <ul className="grid gap-1 text-sm sm:grid-cols-2">{completeness.fields.map(field=>
          <li key={field.key}>{field.label} — missing for {field.missing}</li>)}</ul>
         <p className="text-xs text-muted-foreground">This checks seven fields in the recorded placed-student export, not all graduating learners or external placement evidence.</p>
         {studentReport.rows.length>0?<a href={"/api/placements/reports?"+query.toString()} className="inline-flex min-h-11 sm:min-h-9 items-center text-link underline">
          Export anyway
         </a>:null}
        </div>:null}
        <p className="text-sm">{studentReport.rows.length} placed students in this batch.</p>
        <p className="text-sm text-muted-foreground">{studentReport.warning}</p>
        <DataTable
          caption="Placed students in this batch"
          rows={studentReport.rows.slice(0,50)}
          getRowKey={student=>student.membershipId}
          empty={<p role="status">No placed students were recorded in this batch.</p>}
          columns={[
            {key:"name",header:"Name",cell:student=>student.name??"—",mobilePriority:"primary"},
            {key:"roll",header:"Roll no.",cell:student=>student.rollNumber??"—",mobilePriority:"secondary"},
            {key:"programme",header:"Programme",cell:student=>student.programme??"—",mobilePriority:"secondary"},
            {key:"branch",header:"Branch",cell:student=>student.branch??"—",mobilePriority:"secondary"},
            {key:"batch",header:"Batch",cell:student=>student.batch??"—",mobilePriority:"secondary"},
            {key:"employer",header:"Employer",cell:student=>student.employer??"—",mobilePriority:"secondary"},
            {key:"contact",header:"Employer contact",cell:student=>student.employerContact??"Not recorded",mobilePriority:"secondary"},
            {key:"package",header:"Package (best offer)",cell:student=>accreditationPackageLpa(student.packageInr)??"—",mobilePriority:"secondary"},
            {key:"offers",header:"Offers held",cell:student=>student.offersHeld??"—",mobilePriority:"secondary"},
            {key:"offerStatus",header:"Offer status",cell:student=>accreditationOfferStatusLabel(student.offerStatus)??"—",mobilePriority:"secondary"},
            {key:"joining",header:"Joining",cell:student=>accreditationJoiningLabel(student.joining)??"—",mobilePriority:"secondary"},
          ]}
        />
       </>}
      </section>
      <section className="border-t border-border py-5">
        <h2 className="text-lg font-semibold text-foreground">
          Reporting scope
        </h2>
        <p className="mt-2 text-sm text-body">
          {report.seasonName
            ? "Placement season: " + report.seasonName
            : "No placement season recorded. The CSV includes warnings but no invented outcome totals."}
          {report.selectedJobId
            ? " · Filtered to one authorized drive."
            : " · All non-archived drives in the selected season."}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          Counts reflect currently persisted in-app applications and
          offers. Registered placement-pool and graduating-student
          denominators are not derived from unregistered tables.
        </p>
      </section>

      <section
        aria-label="Accreditation data completeness"
        className="border-t border-border py-5"
      >
        <h2 className="text-lg font-semibold text-foreground">
          Completeness preflight
        </h2>
        <p className="mt-2 text-sm text-body">
          The following warnings are included in the exported CSV.
          Blank denominator/rate cells mean unavailable, not zero.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-6 text-body">
          {report.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">
          Evidence preview
        </h2>
        {overview.length === 0 ? (
          <p className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 text-sm text-body">
            No reportable placement season was found. Download the
            CSV for the explicit completeness warnings.
          </p>
        ) : (
          <DataTable
            caption="Accreditation evidence preview"
            rows={overview.slice(0,50).map((row,index)=>({row,index}))}
            getRowKey={item=>String(item.index)}
            empty={<p role="status">No reportable placement season was found. Download the CSV for the explicit completeness warnings.</p>}
            columns={[
              {key:"section",header:"Section",cell:item=>item.row[0]??"—",mobilePriority:"primary"},
              {key:"dimension",header:"Dimension",cell:item=>item.row[4]??"—",mobilePriority:"secondary"},
              {key:"applicants",header:"Applicants",cell:item=>item.row[6]??"—",mobilePriority:"secondary"},
              {key:"applications",header:"Applications",cell:item=>item.row[7]??"—",mobilePriority:"secondary"},
              {key:"accepted",header:"Accepted offers",cell:item=>item.row[9]??"—",mobilePriority:"secondary"},
              {key:"placed",header:"Placed learners",cell:item=>item.row[10]??"—",mobilePriority:"secondary"},
            ]}
          />
        )}
        {overview.length > 50 ? (
          <p className="text-xs text-muted-foreground">
            Preview limited to 50 rows. The download contains all rows.
          </p>
        ) : null}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        Before using these figures for accreditation, reconcile
        graduation-year populations, external placements,
        programme attribution, reporting definitions and the
        official prescribed NAAC/NIRF column set. No statutory
        placement rate or certified completeness is asserted.
      </p>
    </div>
  );
}
