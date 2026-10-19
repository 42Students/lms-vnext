import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
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
      action={<Link href="/admin/quizzes" className="font-semibold text-primary-text">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context)) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <ErrorState title="Quiz access denied"
      description="Your account cannot access Super Admin quizzes."
      action={<Link href="/dashboard" className="font-semibold text-primary-text">Back to dashboard</Link>}/>
  </div>;
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
        className="font-semibold text-primary-text">Retry loading quizzes</Link>}/>
  </div>;
  const data=dataResult.value;
  return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin · Courses" title="Quizzes" />
    <a href={adminAssessmentExportHref("QUIZ",query.data)}
     className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle">Export quizzes.csv</a>
    {lessonsResult.status==="fulfilled"?
      <CollegeQuizCreate lessons={lessonsResult.value} deliveries={data.reviewDeliveries}/>:
      <p role="status" className="border-l-2 border-warning-border bg-warning-subtle px-3 py-2 text-sm text-body">
        Quiz creation options are temporarily unavailable. Existing quizzes remain visible.
      </p>}
    <AdminAssessmentDirectory data={data} />
  </div>;
}
