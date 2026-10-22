import {z} from "zod";
import type { RequestContext } from "@/modules/identity/context";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {courses,learnerProgramEnrollments,sectionEnrollments,sections} from "@/db/schema";
import {AuthorizationError} from "@/modules/permissions/policy";
import {CoursesServiceError} from "./errors";
import { requireOwnCourseLearnerRead } from "./learner-access-guard";
import {listLearnerCourseDeliveries} from "./learner-course-service";
import {listOwnLearnerAssessmentRows} from "./learner-assessment-flat-query";
import {learnerAssessmentAuthorizedCourse} from "./learner-assessment-course-query-model";

function byDueDateThenTitle<
  T extends {
    dueAt: Date | null;
    title: string;
  },
>(left: T, right: T) {
  const leftDue =
    left.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;
  const rightDue =
    right.dueAt?.getTime() ??
    Number.MAX_SAFE_INTEGER;

  return (
    leftDue - rightDue ||
    left.title.localeCompare(right.title)
  );
}

/** An unavailable course directory must be shown as a retryable error,
 * never as a claim that the learner has no courses. */
export const LEARNER_COURSE_OPTIONS_RETRY_MESSAGE="Couldn't load your courses · Retry";

export async function getLearnerAssessmentOverview(
  context: RequestContext,
  options:{courseId?:unknown;courseSlug?:unknown;deliveryId?:unknown;page?:unknown;pageSize?:unknown}={},
) {
  await requireOwnCourseLearnerRead(context);
  const snapshotNowMs = Date.now();
  let deliveries: Awaited<ReturnType<typeof listLearnerCourseDeliveries>>;
  try {
    deliveries = await listLearnerCourseDeliveries(context);
  } catch (error) {
    if (error instanceof AuthorizationError) throw error;
    throw new CoursesServiceError("COURSE_OPTIONS_UNAVAILABLE");
  }
  // An empty published course list does not prove the learner has no class.
  // Probe persisted ACTIVE learner-section enrollment instead.
  let classScope:"NONE"|"PRESENT"|"UNAVAILABLE"="NONE";
  try{
    if(!context.membership)throw new AuthorizationError("courses.read");
    const classes=await getDb().select({id:sectionEnrollments.id})
      .from(sectionEnrollments)
      .innerJoin(learnerProgramEnrollments,
        eq(learnerProgramEnrollments.id,sectionEnrollments.learnerEnrollmentId))
      .innerJoin(sections,and(
        eq(sections.id,sectionEnrollments.sectionId),
        eq(sections.status,"ACTIVE"),
        eq(sections.cohortId,learnerProgramEnrollments.cohortId),
        eq(sections.academicPeriodId,sectionEnrollments.academicPeriodId),
      ))
      .where(and(eq(learnerProgramEnrollments.membershipId,context.membership.id),
        eq(learnerProgramEnrollments.status,"ACTIVE"),
        eq(sectionEnrollments.status,"ACTIVE")))
      .limit(1);
    classScope=classes.length>0?"PRESENT":"NONE";
  }catch(error){
    if(error instanceof AuthorizationError)throw error;
    classScope="UNAVAILABLE";
  }
  let slugCourseId: string | null = null;
  if (options.courseSlug !== undefined && options.courseSlug !== null && options.courseSlug !== "") {
    const slug = z.string().trim().regex(/^[A-Za-z][A-Za-z0-9._-]{0,63}$/).parse(options.courseSlug).toLowerCase();
    const ids = [...new Set(deliveries.map(row=>row.courseId))];
    if (ids.length === 0) throw new CoursesServiceError("COURSE_NOT_FOUND");
    // Resolve a slug only within already-authorized course deliveries.
    // This retains legacy courseSlug UX without restoring numeric course IDs.
    const candidates = await getDb().select({id:courses.id,slug:courses.slug,code:courses.code})
      .from(courses).where(inArray(courses.id,ids));
    const matching=candidates.filter(row=>
      row.slug?.toLowerCase()===slug||row.code.toLowerCase()===slug);
    if (matching.length!==1) throw new CoursesServiceError("COURSE_NOT_FOUND");
    slugCourseId=matching[0]!.id;
  }
  const explicitCourseId=learnerAssessmentAuthorizedCourse(options.courseId,deliveries);
  const selectedCourseId=explicitCourseId??slugCourseId;
  // An explicit invalid or no-longer-enrolled filter must not silently
  // reset to All courses or select a course from another membership.
  const requestedCourse=options.courseId!==undefined&&options.courseId!==null&&options.courseId!=="";
  if (requestedCourse && (!explicitCourseId || (slugCourseId && explicitCourseId!==slugCourseId)))
    throw new CoursesServiceError("COURSE_NOT_FOUND");
  const requestedDelivery=options.deliveryId===undefined||options.deliveryId===null||
    options.deliveryId===""?null:z.string().uuid().parse(options.deliveryId);
  const scopedDeliveries=deliveries.filter(row=>
    (!selectedCourseId||row.courseId===selectedCourseId)&&
    (!requestedDelivery||row.deliveryId===requestedDelivery));
  if(requestedDelivery && scopedDeliveries.length===0)
    throw new CoursesServiceError("SECTION_DELIVERY_NOT_FOUND");
  // The legacy list uses 20-row pages. Existing unpaged callers retain their
  // full authorized overview; explicitly paged consumers push LIMIT/OFFSET
  // down into both assessment queries, preserving due-date ordering.
  const page=options.page===undefined?null:z.coerce.number().int().min(1).max(100000).parse(options.page);
  const pageSize=options.pageSize===undefined?20:z.coerce.number().int().min(1).max(100).parse(options.pageSize);
  const result=await listOwnLearnerAssessmentRows(scopedDeliveries,context.membership!.id,snapshotNowMs,
    page===null?undefined:{page,pageSize});
  // Window counts are absent on an out-of-range page. Preserve accurate
  // totals for both tabs, even when one has fewer pages than the other.
  if(page!==null&&page>1&&
     (result.totals.assignments===0||result.totals.quizzes===0)){
    const first=await listOwnLearnerAssessmentRows(scopedDeliveries,context.membership!.id,snapshotNowMs,
      {page:1,pageSize:1});
    if(result.totals.assignments===0)result.totals.assignments=first.totals.assignments;
    if(result.totals.quizzes===0)result.totals.quizzes=first.totals.quizzes;
  }
  const {assignments,quizzes}=result;

  assignments.sort(byDueDateThenTitle);
  quizzes.sort(byDueDateThenTitle);

  const courseOptions = [
    ...new Map(
      deliveries.map((delivery) => [
        delivery.courseId,
        {
          id: delivery.courseId,
          name: delivery.courseName,
          code: delivery.courseCode,
        },
      ]),
    ).values(),
  ].sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return {
    snapshotNowMs,
    classScope,
    selectedCourseId,
    courses:courseOptions,
    assignments,
    quizzes,
    ...(page!==null?{pagination:{page,pageSize,totals:result.totals,
      hasMoreAssignments:page*pageSize<result.totals.assignments,
      hasMoreQuizzes:page*pageSize<result.totals.quizzes}}:{}),
  };
}

/** Legacy learner list shape without legacy cross-class or numeric-ID trust.
 * The classId filter is the authorized vNext delivery UUID after the login
 * membership-to-section mapping; no raw Java class ID reaches the SQL query.
 * Progress is reported from own submissions/attempts; it is written only
 * in the submission mutation service, never during a listing request. */
export async function getLearnerQuizzesLegacyPage(
 context:RequestContext,
 filters:{page?:unknown;size?:unknown;courseSlug?:unknown;courseId?:unknown;classId?:unknown}={},
){
 const zeroPage=filters.page===undefined?0:z.coerce.number().int().min(0).max(99999).parse(filters.page);
 const size=filters.size===undefined?20:z.coerce.number().int().min(1).max(100).parse(filters.size);
 const overview=await getLearnerAssessmentOverview(context,{
  courseSlug:filters.courseSlug,courseId:filters.courseId,deliveryId:filters.classId,
  page:zeroPage+1,pageSize:size,
 });
 const total=overview.pagination?.totals.quizzes??overview.quizzes.length;
 return {
  content:overview.quizzes,number:zeroPage,size,totalElements:total,
  totalPages:Math.ceil(total/size),first:zeroPage===0,
  last:(zeroPage+1)*size>=total,
  classScope:overview.classScope,selectedCourseId:overview.selectedCourseId,
 };
}
