import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { AdminAssessmentDirectory } from "@/components/courses/admin-assessment-read-directory";
import {CollegeQuizCreate} from "@/components/courses/college-quiz-create";
import {getCollegeQuizAuthoringOptions} from "@/modules/courses/college-quiz-authoring-options";
import { adminAssessmentExportHref, adminAssessmentHref } from "@/modules/courses/admin-assessment-directory-model";
import {parseSuperAdminQuizQuery} from "@/modules/admin-ui/super-admin-quiz-query-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

export default async function SuperAdminQuizzesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const query = parseSuperAdminQuizQuery(raw);
  if (!query.success) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <ErrorState title="Invalid quiz filters" description="Check search, status and page."
      action={<Link href="/admin/quizzes" className="font-semibold text-[var(--lms-teal-deep)]">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its quizzes." />
  </div>;
  // Listing availability and creation options fail independently. A failed
  // options read must not hide authorized quiz results; failed directory reads
  // must never masquerade as an empty report.
  const [dataResult,lessonsResult]=await Promise.allSettled([
    listCollegeAssessmentAggregate(context, "QUIZ", query.data),
    getCollegeQuizAuthoringOptions(context),
  ]);
  if(dataResult.status==="rejected")return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <ErrorState title="Quizzes unavailable"
      description="The quiz directory could not be loaded. Your filters have not changed."
      action={<Link href={adminAssessmentHref("QUIZ",query.data)}
        className="font-semibold text-[var(--lms-teal-deep)]">Retry loading quizzes</Link>}/>
  </div>;
  const data=dataResult.value;
  return <div className="space-y-4">
    <a href={adminAssessmentExportHref("QUIZ",query.data)}
     className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">Export quizzes.csv</a>
    {lessonsResult.status==="fulfilled"?
      <CollegeQuizCreate lessons={lessonsResult.value} deliveries={data.reviewDeliveries}/>:
      <p role="status" className="rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm text-body">
        Quiz creation options are temporarily unavailable. Existing quizzes remain visible.
      </p>}
    <AdminAssessmentDirectory data={data} />
  </div>;
}
