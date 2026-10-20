import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { AdminAssessmentDirectory } from "@/components/courses/admin-assessment-read-directory";
import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
import {getCollegeAssignmentAuthoringOptions} from "@/modules/courses/college-assignment-authoring-options";
import { adminAssessmentExportHref } from "@/modules/courses/admin-assessment-directory-model";
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
      action={<Link href="/admin/assignments" className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <ErrorState title="Assignment access denied"
      description="Your account cannot access Super Admin assignments."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Back to dashboard</Link>} />
  </div>;
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its assignments." />
  </div>;
  // A failed creation-options read must not erase an authorized assignment
  // directory. A failed directory query must never be shown as an empty list.
  const [dataResult,lessonsResult]=await Promise.allSettled([
    listCollegeAssessmentAggregate(context,"ASSIGNMENT",query.data),
    getCollegeAssignmentAuthoringOptions(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <ErrorState title="Assignments unavailable"
      description="The assignment directory could not be loaded. Your filters have not changed."
      action={<Link href="/admin/assignments"
        className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Retry loading assignments</Link>} />
  </div>;
  const data=dataResult.value;
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <a href={adminAssessmentExportHref("ASSIGNMENT",query.data)}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 print:hidden">Export assignments.csv</a>
    {lessonsResult.status==="fulfilled"
      ?<CollegeAssignmentCreate lessons={lessonsResult.value} deliveries={data.reviewDeliveries}/>
      :<Alert tone="warning" role="status">
        Assignment creation options are temporarily unavailable. Existing assignments remain visible.
      </Alert>}
    <AdminAssessmentDirectory data={data} />
  </div>;
}
