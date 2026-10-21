import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
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
      action={<Link href="/admin/quizzes" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context)) return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" />
    <ErrorState title="Quiz access denied"
      description="Your account cannot access Super Admin quizzes."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Back to dashboard</Link>}/>
  </div>;
  if (!context.adminScope?.collegeId) return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its quizzes." />
  </div>;
  // The selected college must pass both the identity and permission boundary;
  // a forged college or organization selection must never reach the read model.
  try{requireSuperAdminSelectedCollege(context,"courses.read");}
  catch{return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes"/>
    <ErrorState title="Quiz access denied"
      description="The selected college is not accessible in your organization or administrative scope. Choose an authorized college."
      action={<Link href="/admin/quizzes" className="font-semibold text-primary-text underline">Retry selected college</Link>}/>
  </div>;}
  // Listing availability and creation options fail independently. A failed
  // options read must not hide authorized quiz results; failed directory reads
  // must never masquerade as an empty report.
  const [dataResult,lessonsResult]=await Promise.allSettled([
    listCollegeAssessmentAggregate(context, "QUIZ", query.data),
    getCollegeQuizAuthoringOptions(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" />
    <ErrorState title="Quizzes could not be loaded"
      description="Failed to fetch quizzes. Please try again. Your selected college and filters have not changed."
      action={<Link href={adminAssessmentHref("QUIZ",query.data)}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry loading quizzes</Link>}/>
  </div>;
  const data=dataResult.value;
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" description="Quizzes across the selected college. Submission/attempt counts reflect persisted rows, not distinct learners or completion rates." actions={<a href={adminAssessmentExportHref("QUIZ",query.data)}
     className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text md:min-h-9 md:w-auto print:hidden hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Export filtered quizzes (up to 500 rows)</a>} />
    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
      Quizzes fetched successfully · {data.total.toLocaleString("en-IN")} matching quizzes in the selected college.
    </p>
    {lessonsResult.status==="fulfilled"?
      <CollegeQuizCreate key={context.adminScope.collegeId}
        lessons={lessonsResult.value} deliveries={data.reviewDeliveries}/>:
      <Alert tone="warning">
        Quiz setup options could not be loaded. Existing quizzes remain visible.{" "}
        <Link href={adminAssessmentHref("QUIZ",query.data)}
          className="font-semibold text-primary-text underline">Retry options</Link>.
      </Alert>}
    <AdminAssessmentDirectory key={context.adminScope.collegeId}
      data={data} showHeader={false} />
  </div>;
}
