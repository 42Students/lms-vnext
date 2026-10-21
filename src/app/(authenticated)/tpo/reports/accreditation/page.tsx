import { Input } from "@/components/ui/input";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {TPO_LEGACY_REPORT_COPY} from "@/modules/placements/tpo-legacy-report-copy";
import {TpoReportPresentation} from "@/components/placements/tpo-report-presentation";
import {TpoAccreditationExportPreflight} from "@/components/placements/tpo-accreditation-export-preflight";
import {Disclosure} from "@/components/ui/disclosure";
import {Suspense} from "react";
import {TpoReportSavedFilters} from "@/components/placements/tpo-report-saved-filters";
import { DataTable } from "@/components/ui/data-table";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
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
    <div data-tpo-presentation-report className="min-w-0 space-y-4">
      <PageHeader
        eyebrow="TPO · Reports"
        title="Accreditation export"
        description={TPO_LEGACY_REPORT_COPY["/tpo/reports/accreditation"].description}
        actions={<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto"><PageBackLink href="/tpo/reports" label="All reports" />{selectedBatch&&studentReport&&studentReport.rows.length>0?
          <TpoAccreditationExportPreflight href={"/api/placements/reports?"+query.toString()}
           total={completeness?.total??studentReport.rows.length}
           missingStudents={completeness?.missingStudents??0}
           fields={completeness?.fields??[]}/>:
          <span aria-disabled="true" role="status" className="inline-flex min-h-11 w-full cursor-not-allowed items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle px-4 text-sm font-semibold text-muted-foreground sm:w-auto md:min-h-9">
           Export student list CSV — {selectedBatch?"No placed students":"Pick a batch first"}
          </span>
        }</div>}
      />
      <TpoReportPresentation />
      <Suspense fallback={null}><TpoReportSavedFilters path="/tpo/reports/accreditation" collegeId={context.membership.collegeId} userId={context.user.id}/></Suspense>
      <section aria-labelledby="section-naac-5-2-1-placed-students" id="accreditation-batch" className="space-y-3 border-t border-border pt-6">
       <h2 id="section-naac-5-2-1-placed-students" className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">NAAC 5.2.1 · Placed students</h2>
       <p role="status" className="text-sm leading-[1.6]">NAAC 5.2.1 lists the students of one batch. Pick the batch above.</p>
       <form role="search" aria-label="reports accreditation filters" method="get" className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
         <Select name="batchId" defaultValue={selectedBatch?.id??""} className="mt-[6px] block min-h-11 min-[768px]:min-h-9">
          <option value="">Pick a batch</option>
          {batches.batches.map(batch=><option key={batch.id} value={batch.id}>{batch.name}</option>)}
         </Select>
        </label>
        {report.selectedSeasonId&&<Input type="hidden" name="seasonId" value={report.selectedSeasonId}/>}
        {report.selectedJobId&&<Input type="hidden" name="jobId" value={report.selectedJobId}/>}
        <Button variant="secondary" type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9">Show students</Button>
       </form>
       {batchId&&!selectedBatch&&<Alert tone="error">Choose a batch from this college.</Alert>}
       {selectedBatch&&studentReport?.rows.length===0?<Alert tone="info">No placed students in this batch. Export is unavailable until a recorded placement exists.</Alert>:null}
       {studentReport&&<>
        {completeness?<div role="group" aria-label="NAAC and NIRF completeness" className="min-w-0 space-y-2 border-y border-border py-4">
         <h3 className="font-semibold text-[16px] leading-[1.4] text-[var(--lms-heading)]">{completeness.missingStudents} of {completeness.total} students are missing data NAAC/NIRF ask for</h3>
         <ul className="grid gap-1 text-sm min-[768px]:grid-cols-2">{completeness.fields.map(field=>
          <li key={field.key}>{field.label} — missing for {field.missing}</li>)}</ul>
         <p className="text-xs text-muted-foreground leading-5">This checks seven fields in the recorded placed-student export, not all graduating learners or external placement evidence.</p>
         {studentReport.rows.length>0?<TpoAccreditationExportPreflight href={"/api/placements/reports?"+query.toString()}
          total={completeness.total} missingStudents={completeness.missingStudents}
          fields={completeness.fields} compact/>:null}
        </div>:null}
        <p className="text-sm leading-[22px]">{studentReport.rows.length} placed students in this batch.</p>
        <p className="text-sm text-muted-foreground leading-[22px]">{studentReport.warning}</p>
        <DataTable
          caption="Placed students in this batch"
          rows={studentReport.rows.slice(0,50)}
          getRowKey={student=>student.membershipId}
          empty={<EmptyState title="No placed students were recorded in this batch."/>}
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
      <section aria-labelledby="section-reporting-scope" className="border-t border-border py-4">
        <h2 id="section-reporting-scope" className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">
          Reporting scope
        </h2>
        <p className="mt-2 text-sm text-body leading-[22px]">
          {report.seasonName
            ? "Placement season: " + report.seasonName
            : "No placement season recorded. The CSV includes warnings but no invented outcome totals."}
          {report.selectedJobId
            ? " · Filtered to one authorized drive."
            : " · All non-archived drives in the selected season."}
        </p>
        <p className="mt-2 text-xs text-muted-foreground leading-[1.6]">
          Counts reflect currently persisted in-app applications and
          offers. Registered placement-pool and graduating-student
          denominators are not derived from unregistered tables.
        </p>
      </section>

      <Disclosure title="Completeness preflight" ariaLabel="Accreditation data completeness" className="border-y border-border py-3">
        <div className="min-w-0 pt-3">
        
        <p className="mt-2 text-sm text-body leading-[22px]">
          The following warnings are included in the exported CSV.
          Blank denominator/rate cells mean unavailable, not zero.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-6 text-body">
          {report.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
        </div>
      </Disclosure>

      <section aria-labelledby="section-evidence-preview" className="space-y-3">
        <h2 id="section-evidence-preview" className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">
          Evidence preview
        </h2>
        {overview.length === 0 ? (
          <p className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6 text-sm text-body leading-[22px]">
            No reportable placement season was found. Download the
            CSV for the explicit completeness warnings.
          </p>
        ) : (
          <DataTable
            caption="Accreditation evidence preview"
            rows={overview.slice(0,50).map((row,index)=>({row,index}))}
            getRowKey={item=>String(item.index)}
            empty={<EmptyState title="No reportable placement season was found." description="Download the CSV for the explicit completeness warnings."/>}
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
          <p className="text-xs text-muted-foreground leading-5">
            Preview limited to 50 rows. The download contains all rows.
          </p>
        ) : null}
      </section>

      <p className="text-xs text-muted-foreground leading-[1.6]">
        Before using these figures for accreditation, reconcile
        graduation-year populations, external placements,
        programme attribution, reporting definitions and the
        official prescribed NAAC/NIRF column set. No statutory
        placement rate or certified completeness is asserted.
      </p>
    </div>
  );
}
