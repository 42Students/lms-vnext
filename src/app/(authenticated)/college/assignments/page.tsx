import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeAssessmentAggregate } from "@/components/courses/college-assessment-aggregate";
import {CollegeAssignmentCreate} from "@/components/courses/college-assignment-create";
import {getCollegeAssignmentAuthoringCatalog} from "@/modules/courses/college-assignment-authoring-options";
import Link from "next/link";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { collegeAssessmentHref, collegeAssessmentListQuerySchema, parseCollegeAssessmentQuery } from "@/modules/courses/college-assessment-aggregate-model";
import { listCollegeAssessmentAggregate } from "@/modules/courses/college-assessment-aggregate-service";

type SearchParams = Record<string, string | string[] | undefined>;
function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CollegeAssignmentsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  const context = await getCurrentRequestContext();
  if(!context.membership)return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments"/>
    <Alert tone="warning" role="alert">
      <strong>Admin not assigned to a college</strong>
      <p>Contact your administrator to be assigned to a college before managing assignments.</p>
    </Alert>
  </div>;
  const params = await searchParams;
  const raw = { q: one(params.q), status: one(params.status), courseCode: one(params.courseCode)||undefined,deliveryId: one(params.deliveryId)||undefined,periodCode:one(params.periodCode)||undefined,cohortCode:one(params.cohortCode)||undefined,programCode:one(params.programCode)||undefined, scope:one(params.scope),duePresence:one(params.duePresence),dueWindow:one(params.dueWindow), page: one(params.page) };
  const validation = collegeAssessmentListQuerySchema.safeParse(
    Object.fromEntries(Object.entries(raw).filter(([, value]) => value !== undefined)),
  );
  if (!validation.success || validation.data.status === "CLOSED") {
    return (
      <div className="min-w-0 overflow-x-clip space-y-4">
        <PageHeader title="Assignments" />
        <ErrorState title="Invalid assessment filters"
          description="The requested search, status or page is invalid. No records were loaded."
          action={<Link href="/college/assignments" className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)] hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto">Clear filters</Link>}/>
      </div>
    );
  }
  const query=parseCollegeAssessmentQuery("ASSIGNMENT",validation.data);
  const [dataResult,lessonsResult]=await Promise.allSettled([
    listCollegeAssessmentAggregate(context,"ASSIGNMENT",query),
    getCollegeAssignmentAuthoringCatalog(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 space-y-4">
    <PageHeader title="Assignments"/>
    <ErrorState title="Assignments could not be loaded"
      description="Assignments could not be loaded. Your filters have not changed; retry to load the list."
      action={<Link href={collegeAssessmentHref("ASSIGNMENT",query)}
        className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">
        Retry
      </Link>}/>
  </div>;
  const data=dataResult.value;
  return <div className="min-w-0 overflow-x-clip space-y-4">
    <nav aria-label="Courses & Content" className="flex items-center gap-2 text-sm text-body">
      <Link href="/college/courses" className="font-semibold text-primary-text hover:underline">Courses & Content</Link>
      <span aria-hidden="true">›</span><span aria-current="page">Assignments</span>
    </nav>
    <CollegeAssessmentAggregate data={data}
      leading={lessonsResult.status==="fulfilled"?
        <CollegeAssignmentCreate lessons={lessonsResult.value.lessons} deliveries={lessonsResult.value.deliveries}/>:
        <Alert tone="warning" role="status">
          <strong>Course list unavailable</strong>
          <p>Assignment creation options could not be loaded. Existing assignments remain visible.</p>
          <Link href={collegeAssessmentHref("ASSIGNMENT",query)}
            className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">
            Retry courses
          </Link>
        </Alert>}/>
  </div>;
}
