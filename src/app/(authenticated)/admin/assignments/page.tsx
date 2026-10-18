import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAssessmentDirectory } from "@/components/courses/admin-assessment-read-directory";
import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
import {getCollegeAssignmentAuthoringOptions} from "@/modules/courses/college-assignment-authoring-options";
import { adminAssessmentExportHref, adminAssessmentQuerySchema } from "@/modules/courses/admin-assessment-directory-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

export default async function SuperAdminAssignmentsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const query = adminAssessmentQuerySchema.safeParse({ q: raw.q, status: raw.status, page: raw.page,
    courseCode:raw.courseCode,scope:raw.scope,results:raw.results });
  if (!query.success || query.data.status === "CLOSED" || query.data.results !== "ALL") return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Assignments" />
    <ErrorState title="Invalid assignment filters" description="Check search, status and page."
      action={<Link href="/admin/assignments" className="font-semibold text-[var(--lms-teal-deep)]">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Assignments" />
    <ErrorState title="Assignment access denied"
      description="Your account cannot access Super Admin assignments."
      action={<Link href="/dashboard" className="font-semibold text-[var(--lms-teal-deep)]">Back to dashboard</Link>} />
  </div>;
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Assignments" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its assignments." />
  </div>;
  // A failed creation-options read must not erase an authorized assignment
  // directory. A failed directory query must never be shown as an empty list.
  const [dataResult,lessonsResult]=await Promise.allSettled([
    listCollegeAssessmentAggregate(context,"ASSIGNMENT",query.data),
    getCollegeAssignmentAuthoringOptions(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Assignments" />
    <ErrorState title="Assignments unavailable"
      description="The assignment directory could not be loaded. Your filters have not changed."
      action={<Link href="/admin/assignments"
        className="font-semibold text-[var(--lms-teal-deep)]">Retry loading assignments</Link>} />
  </div>;
  const data=dataResult.value;
  return <div className="min-w-0 space-y-4">
    <a href={adminAssessmentExportHref("ASSIGNMENT",query.data)}
     className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">Export assignments.csv</a>
    {lessonsResult.status==="fulfilled"
      ?<CollegeAssignmentCreate lessons={lessonsResult.value} deliveries={data.reviewDeliveries}/>
      :<p role="status" className="rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm text-body">
        Assignment creation options are temporarily unavailable. Existing assignments remain visible.
      </p>}
    <AdminAssessmentDirectory data={data} />
  </div>;
}
