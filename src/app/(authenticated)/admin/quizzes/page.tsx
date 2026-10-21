import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
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
    <PageHeader title="Quizzes" eyebrow="Courses & Content"/>
    <ErrorState title="Invalid quiz filters" description="Check search, status and page."
      action={<Link href="/admin/quizzes" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if(!isSuperAdmin(context)) return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" eyebrow="Courses & Content"/>
    <ErrorState title="Quiz access denied"
      description="Your account cannot access Super Admin quizzes."
      action={<Link href="/dashboard" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Back to dashboard</Link>}/>
  </div>;
  if (!context.adminScope?.collegeId) return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" eyebrow="Courses & Content"/>
    <Alert tone="warning" role="alert" title="Select a college to continue">
      <span className="inline-flex items-center gap-2">
       <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3 22 21H2L12 3Zm0 7v5m0 3v.1"/></svg>
       Choose a college in the header above to see its quizzes.
      </span>
    </Alert>
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
    <PageHeader title="Quizzes" eyebrow="Courses & Content"/>
    <ErrorState title="Quizzes could not be loaded"
      description="Failed to fetch quizzes. Please try again. Your selected college and filters have not changed."
      action={<Link href={adminAssessmentHref("QUIZ",query.data)}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Retry loading quizzes</Link>}/>
  </div>;
  const data=dataResult.value;
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title="Quizzes" eyebrow="Courses & Content"
      actions={data.items.length?
       <a href={adminAssessmentExportHref("QUIZ",query.data,"PAGE")} download
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text md:min-h-9 md:w-auto print:hidden hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4"><path d="M10 2.5v10m-4-4 4 4 4-4M3 13.5v3h14v-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Export CSV (page)
       </a>:
       <span aria-disabled="true" className="inline-flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-muted px-3 text-sm text-muted-foreground opacity-60 md:min-h-9">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" className="size-4"><path d="M10 2.5v10m-4-4 4 4 4-4M3 13.5v3h14v-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Export CSV (page)
       </span>}/>
    <div className="min-w-0 flex flex-col gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
      <form method="get" action="/admin/quizzes" className="flex min-w-0 flex-wrap items-end gap-3" aria-label="Filter quizzes by course">
       {Object.entries(query.data).filter(([key,value])=>key!=="courseCode"&&key!=="page"&&value!==undefined&&value!==""&&value!=="ALL")
        .map(([key,value])=><input key={key} type="hidden" name={key} value={String(value)}/>)}
       <label className="grid min-w-0 flex-1 gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)] sm:max-w-[380px]">
        Course
        <select name="courseCode" defaultValue={query.data.courseCode??""}
         className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-sm text-body md:min-h-9">
         <option value="">All courses</option>
         {data.directoryCourses.map(course=><option key={course.code} value={course.code}>{course.code} · {course.name}</option>)}
        </select>
       </label>
       <button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] bg-[var(--lms-primary)] px-4 text-sm font-semibold text-white md:min-h-9">Apply</button>
       {query.data.courseCode?<Link href="/admin/quizzes" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear</Link>:null}
      </form>
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
       Quizzes fetched successfully · {data.total.toLocaleString("en-IN")} matching quizzes in this college · {data.items.length} on this page.
      </p>
    </div>
    <div className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-3">
    {lessonsResult.status==="fulfilled"?
      <CollegeQuizCreate key={context.adminScope.collegeId}
        lessons={lessonsResult.value} deliveries={data.reviewDeliveries}/>:
      <Alert tone="warning">
        Quiz setup options could not be loaded. Existing quizzes remain visible.{" "}
        <Link href={adminAssessmentHref("QUIZ",query.data)}
          className="font-semibold text-primary-text underline">Retry options</Link>.
      </Alert>}
    </div>
    <AdminAssessmentDirectory key={context.adminScope.collegeId}
      data={data} showHeader={false} />
  </div>;
}
