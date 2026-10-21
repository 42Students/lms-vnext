import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AdminAssessmentDirectory } from "@/components/courses/admin-assessment-read-directory";
import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
import {getCollegeAssignmentAuthoringCatalog} from "@/modules/courses/college-assignment-authoring-options";
import { adminAssessmentExportHref, adminAssessmentHref } from "@/modules/courses/admin-assessment-directory-model";
import {parseSuperAdminAssignmentQuery} from "@/modules/admin-ui/super-admin-quiz-query-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

export default async function SuperAdminAssignmentsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const query = parseSuperAdminAssignmentQuery(raw);
  if (!query.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <ErrorState title="Invalid assignment filters" description="Check search, status and page."
      action={<Link href="/admin/assignments" className="inline-flex min-h-11 items-center font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] hover:underline w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  const retryHref=adminAssessmentHref("ASSIGNMENT",query.data);
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <ErrorState title="Assignment access denied"
      description="Your account cannot access Super Admin assignments."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] hover:underline w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Back to dashboard</Link>} />
  </div>;
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its assignments." />
  </div>;
  // A failed creation-options read must not erase an authorized assignment
  // directory. A failed directory query must never be shown as an empty list.
  const [dataResult,lessonsResult]=await Promise.allSettled([
    listCollegeAssessmentAggregate(context,"ASSIGNMENT",query.data),
    getCollegeAssignmentAuthoringCatalog(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <ErrorState title="Assignments could not be loaded"
      description="The assignment directory could not be loaded. Your filters have not changed."
      action={<Link href={retryHref}
        className="inline-flex min-h-11 items-center font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] hover:underline w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Retry loading assignments</Link>} />
  </div>;
  const data=dataResult.value;
  return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader title="Assignments" actions={lessonsResult.status==="fulfilled"?
      <CollegeAssignmentCreate lessons={lessonsResult.value.lessons} deliveries={lessonsResult.value.deliveries}/>:
      null}/>
    {lessonsResult.status==="rejected"?<Alert tone="warning" role="alert">
      <strong>Course list unavailable · Section list unavailable.</strong>
      <span>Assignment creation options could not be verified. Existing assignments remain visible, but creation is paused.</span>
      <Link href={retryHref} className="lms-inline-link font-semibold underline underline-offset-4">
        Retry courses and sections
      </Link>
    </Alert>:null}
    <AdminAssessmentDirectory data={data} showHeader={false} />
    <div className="flex min-w-0 flex-wrap justify-start gap-2 print:hidden">
      {data.items.length ? <a download href={adminAssessmentExportHref("ASSIGNMENT",query.data,"PAGE")}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-white)] px-[var(--lms-space-4)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-body-text)] md:min-h-9">
        <span aria-hidden="true" className="mr-2">↓</span>Export CSV (page)
      </a> : <Button variant="secondary" disabled>Export CSV (page)</Button>}
      <a download href={adminAssessmentExportHref("ASSIGNMENT",query.data)}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-white)] px-[var(--lms-space-4)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-body-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:bg-[var(--lms-button-primary-hover)] active:bg-[var(--lms-button-primary-hover)]">
        Export all matching
      </a>
    </div>
  </div>;
}
