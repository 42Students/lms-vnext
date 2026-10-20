import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
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
  if (!query.success) return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" />
    <ErrorState title="Invalid quiz filters" description="Check search, status and page."
      action={<Link href="/admin/quizzes" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context)) return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" />
    <ErrorState title="Quiz access denied"
      description="Your account cannot access Super Admin quizzes."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Back to dashboard</Link>}/>
  </div>;
  if (!context.adminScope?.collegeId) return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its quizzes." />
  </div>;
  // Listing availability and creation options fail independently. A failed
  // options read must not hide authorized quiz results; failed directory reads
  // must never masquerade as an empty report.
  const [dataResult,lessonsResult]=await Promise.allSettled([
    listCollegeAssessmentAggregate(context, "QUIZ", query.data),
    getCollegeQuizAuthoringOptions(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" />
    <ErrorState title="Quizzes unavailable"
      description="The quiz directory could not be loaded. Your filters have not changed."
      action={<Link href={adminAssessmentHref("QUIZ",query.data)}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Retry loading quizzes</Link>}/>
  </div>;
  const data=dataResult.value;
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" actions={<a href={adminAssessmentExportHref("QUIZ",query.data)}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9 print:hidden">Export quizzes.csv</a>} />
    {lessonsResult.status==="fulfilled"?
      <CollegeQuizCreate lessons={lessonsResult.value} deliveries={data.reviewDeliveries}/>:
      <Alert tone="warning">
        Quiz creation options are temporarily unavailable. Existing quizzes remain visible.
      </Alert>}
    <AdminAssessmentDirectory data={data} showHeader={false} />
  </div>;
}
