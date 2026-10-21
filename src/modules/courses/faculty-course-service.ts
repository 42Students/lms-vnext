import {alias} from "drizzle-orm/pg-core";
import {
  and,
  asc,
  desc,
  eq,
  isNull,
  lte,
  sql,
} from "drizzle-orm";
import {z} from "zod";
import { getDb } from "@/db/client";
import {
  academicPeriods,
  cohorts,
  collegeMemberships,
  membershipRoles,
  users,
  courseOfferings,
  courseSectionDeliveries,
  courseTeachingAssignments,
  departments,
  programs,
  courses,
  sections,
} from "@/db/schema";
import type { RequestContext } from "@/modules/identity/context";
import { CoursesServiceError } from "./errors";
import {
  requireLearningReadAccess,
} from "./learning-access";
import { listLearningPaths } from "./learning-path-service";
import { listCourseLessons } from "./lesson-service";
import { listLessonContents } from "./lesson-content-service";
import { listCourseAssignments } from "./assignment-service";
import { listCourseQuizzes } from "./quiz-service";
import {
  courseSectionDeliveryIdSchema,
} from "./validation";
import {
  loadCourseSectionDeliveryScope,
} from "./scope";

const cohortDepartments=alias(departments,"faculty_cohort_departments");

/** UUID memberships replace legacy faculty/class integer grants. Semester/year
 * come from the offering\u2019s academic period, cohort is the former batch, endedAt
 * is the retired/soft-deleted grant marker. There is no faculty ADMIN subtype:
 * the membership role switcher selects COLLEGE_ADMIN separately. */
const facultyDeliveryFilterSchema=z.strictObject({
  sectionId:z.string().uuid().optional(),
  cohortId:z.string().uuid().optional(),
  academicPeriodId:z.string().uuid().optional(),
});
export type FacultyDeliveryFilter=z.infer<typeof facultyDeliveryFilterSchema>;

function requireFacultyMembership(
  context: RequestContext,
) {
  if (
    context.user.platformStatus !== "ACTIVE" ||
    !context.membership ||
    context.membership.status !== "ACTIVE" ||
    !context.membership.roles.includes("FACULTY")
  ) {
    throw new CoursesServiceError(
      "FACULTY_TEACHING_SCOPE_REQUIRED",
    );
  }

  return context.membership;
}

export async function listFacultyCourseDeliveries(
  context: RequestContext,
  filters:FacultyDeliveryFilter = {},
) {
  const membership = requireFacultyMembership(context);
  const selected=facultyDeliveryFilterSchema.parse(filters);

  return getDb()
    .select({
      teachingAssignmentId:
        courseTeachingAssignments.id,
      teachingRole:
        courseTeachingAssignments.role,
      deliveryId:
        courseSectionDeliveries.id,
      offeringId:
        courseOfferings.id,
      offeringType:
        courseOfferings.type,
      credits: courseOfferings.credits,
      courseId: courses.id,
      courseName: courses.name,
      courseCode: courses.code,
      courseDescription:
        courses.description,
      sectionId: sections.id,
      sectionName: sections.name,
      sectionCode: sections.code,
      cohortName: cohorts.name,
      cohortCode: cohorts.code,
      academicPeriodId:
        academicPeriods.id,
      academicPeriodName:
        academicPeriods.name,
      academicPeriodCode:
        academicPeriods.code,
      academicPeriodStatus:
        academicPeriods.status,
      periodStartDate: academicPeriods.startDate,
      periodEndDate: academicPeriods.endDate,
      startedAt:
        courseTeachingAssignments.startedAt,
    })
    .from(courseTeachingAssignments)
    // A stale identity cookie cannot preserve faculty read access once the
    // authoritative membership is suspended, reassigned or de-roled.
    .innerJoin(
      collegeMemberships,
      and(
        eq(collegeMemberships.id, courseTeachingAssignments.membershipId),
        eq(collegeMemberships.userId, context.user.id),
        eq(collegeMemberships.collegeId, membership.collegeId),
        eq(collegeMemberships.status, "ACTIVE"),
      ),
    )
    .innerJoin(
      users,
      and(
        eq(users.id, collegeMemberships.userId),
        eq(users.platformStatus, "ACTIVE"),
      ),
    )
    .innerJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, collegeMemberships.id),
        eq(membershipRoles.role, "FACULTY"),
      ),
    )
    .innerJoin(
      courseSectionDeliveries,
      eq(
        courseSectionDeliveries.id,
        courseTeachingAssignments.deliveryId,
      ),
    )
    .innerJoin(
      courseOfferings,
      eq(
        courseOfferings.id,
        courseSectionDeliveries.offeringId,
      ),
    )
    .innerJoin(
      courses,
      eq(
        courses.id,
        courseOfferings.courseId,
      ),
    )
    .innerJoin(
      departments,
      and(
        eq(departments.id, courses.departmentId),
        eq(departments.collegeId, membership.collegeId),
      ),
    )
    // The teaching-grant membership is authoritative, but FK relationships
    // alone do not establish same-college course/Section/term ownership.
    .innerJoin(sections,and(
      eq(sections.id,courseSectionDeliveries.sectionId),
      eq(sections.cohortId,courseOfferings.cohortId),
      eq(sections.academicPeriodId,courseOfferings.academicPeriodId),
    ))
    .innerJoin(cohorts,and(
      eq(cohorts.id,sections.cohortId),
      eq(cohorts.id,courseOfferings.cohortId),
    ))
    .innerJoin(programs,eq(programs.id,cohorts.programId))
    .innerJoin(cohortDepartments,and(
      eq(cohortDepartments.id,programs.departmentId),
      eq(cohortDepartments.collegeId,membership.collegeId),
    ))
    .innerJoin(academicPeriods,and(
      eq(academicPeriods.id,courseOfferings.academicPeriodId),
      eq(academicPeriods.id,sections.academicPeriodId),
      eq(academicPeriods.collegeId,membership.collegeId),
    ))
    .where(
      and(
        eq(
          courseTeachingAssignments.membershipId,
          membership.id,
        ),
        isNull(
          courseTeachingAssignments.endedAt,
        ),
        // A future scheduled teaching grant is not active yet. Ended grants
        // stay excluded even if a migration encoded a future end timestamp.
        lte(courseTeachingAssignments.startedAt,sql`now()`),
        isNull(
          courseSectionDeliveries.endedAt,
        ),
        eq(
          courseOfferings.status,
          "ACTIVE",
        ),
        eq(courses.status, "ACTIVE"),
        eq(sections.status, "ACTIVE"),
        selected.sectionId?eq(sections.id,selected.sectionId):undefined,
        selected.cohortId?eq(cohorts.id,selected.cohortId):undefined,
        selected.academicPeriodId?eq(academicPeriods.id,selected.academicPeriodId):undefined,
      ),
    )
    .orderBy(
      desc(academicPeriods.startDate),
      asc(courses.name),
      asc(sections.name),
    );
}

/** Observe the actor's own teaching grants without joining potentially
 * foreign course data into diagnostic cards. Broken links stay unclickable. */
export type FacultyCourseAssignmentDiagnostic={
 teachingAssignmentId:string;
 reason:"INCOMPLETE_ASSIGNMENT"|"MISSING_COURSE_NAME"|"DUPLICATE_ASSIGNMENT";
};
export async function listFacultyCourseAssignmentDiagnostics(
 context:RequestContext,
):Promise<FacultyCourseAssignmentDiagnostic[]>{
 const membership=requireFacultyMembership(context);
 const assigned=await listFacultyCourseDeliveries(context);
 const rows=await getDb().select({
  id:courseTeachingAssignments.id,deliveryId:courseTeachingAssignments.deliveryId,
 }).from(courseTeachingAssignments)
  .innerJoin(collegeMemberships,and(
   eq(collegeMemberships.id,courseTeachingAssignments.membershipId),
   eq(collegeMemberships.userId,context.user.id),
   eq(collegeMemberships.collegeId,membership.collegeId),
   eq(collegeMemberships.status,"ACTIVE"),
  ))
  .innerJoin(users,and(eq(users.id,collegeMemberships.userId),
   eq(users.platformStatus,"ACTIVE")))
  .innerJoin(membershipRoles,and(
   eq(membershipRoles.membershipId,collegeMemberships.id),
   eq(membershipRoles.role,"FACULTY"),
  ))
  .where(and(
   eq(courseTeachingAssignments.membershipId,membership.id),
   isNull(courseTeachingAssignments.endedAt),
   lte(courseTeachingAssignments.startedAt,sql`now()`),
  )).limit(1000);
 const byId=new Map(assigned.map(item=>[item.teachingAssignmentId,item]));
 const counts=new Map<string,number>();
 for(const row of rows)counts.set(row.deliveryId,(counts.get(row.deliveryId)??0)+1);
 return rows.flatMap((row):FacultyCourseAssignmentDiagnostic[]=>{
  const valid=byId.get(row.id);
  if(!valid)return [{teachingAssignmentId:row.id,reason:"INCOMPLETE_ASSIGNMENT"}];
  if(!valid.courseName.trim())return [{teachingAssignmentId:row.id,reason:"MISSING_COURSE_NAME"}];
  if((counts.get(row.deliveryId)??0)>1)
   return [{teachingAssignmentId:row.id,reason:"DUPLICATE_ASSIGNMENT"}];
  return [];
 });
}

/** Safe compatibility resolver: never resolve an ambiguous or unauthorized
 * historical course/class link. Numeric legacy IDs need an explicit migration
 * crosswalk and are intentionally not guessed from current UUID rows. */
export async function resolveFacultyCourseDeliveryForLink(
 context:RequestContext, rawCourse:string, rawClass?:string|null,
):Promise<string|null>{
 requireFacultyMembership(context);
 const course=rawCourse.trim().toLowerCase();
 const section=(rawClass??"").trim().toLowerCase();
 if(!course||/^\d+$/.test(course)||(section&&/^\d+$/.test(section))||course.length>160||section.length>160||
    !/^[a-z0-9_-]+$/.test(course)||
    (section&&!/^[a-z0-9_-]+$/.test(section)))return null;
 const rows=await listFacultyCourseDeliveries(context);
 const matches=rows.filter(row=>{
  const knownCourse=[row.deliveryId,row.courseId,row.courseCode,
   row.courseCode.toLowerCase().replace(/[^a-z0-9]+/g,"-")];
  if(!knownCourse.some(key=>key.toLowerCase()===course))return false;
  if(!section)return true;
  return [row.sectionId,row.sectionCode].some(key=>key.toLowerCase()===section);
 });
 return matches.length===1?matches[0]!.deliveryId:null;
}
export async function getFacultyCourseWorkspace(
  context: RequestContext,
  deliveryIdInput: string,
) {
  const deliveryId =
    courseSectionDeliveryIdSchema.parse(
      deliveryIdInput,
    );
  requireFacultyMembership(context);

  const delivery =
    await loadCourseSectionDeliveryScope(
      deliveryId,
    );
  const access =
    await requireLearningReadAccess(
      context,
      delivery.offeringId,
      deliveryId,
    );

  if (access !== "FACULTY") {
    throw new CoursesServiceError(
      "FACULTY_TEACHING_SCOPE_REQUIRED",
    );
  }

  const assigned =
    await listFacultyCourseDeliveries(context);
  const course = assigned.find(
    (row) => row.deliveryId === deliveryId,
  );

  if (!course) {
    throw new CoursesServiceError(
      "FACULTY_TEACHING_SCOPE_REQUIRED",
    );
  }

  const paths = await listLearningPaths(
    context,
    course.offeringId,
    deliveryId,
  );
  const learningPath = paths[0] ?? null;

  if (!learningPath) {
    return {
      course,
      learningPath: null,
      lessons: [],
      summary: {
        lessons: 0,
        contents: 0,
        assignments: 0,
        quizzes: 0,
        draftItems: 0,
        publishedItems: 0,
      },
    };
  }

  const lessonRows = await listCourseLessons(
    context,
    learningPath.id,
    deliveryId,
  );

  const lessons = await Promise.all(
    lessonRows.map(async (lesson) => {
      const [contents, assignments, quizzes] =
        await Promise.all([
          listLessonContents(
            context,
            lesson.id,
            deliveryId,
          ),
          listCourseAssignments(
            context,
            lesson.id,
            deliveryId,
          ),
          listCourseQuizzes(
            context,
            lesson.id,
            deliveryId,
          ),
        ]);

      return {
        ...lesson,
        contents,
        assignments,
        quizzes,
      };
    }),
  );

  const contents = lessons.flatMap(
    (lesson) => lesson.contents,
  );
  const assignments = lessons.flatMap(
    (lesson) => lesson.assignments,
  );
  const quizzes = lessons.flatMap(
    (lesson) => lesson.quizzes,
  );
  const statuses = [
    ...contents.map((item) => item.status),
    ...assignments.map((item) => item.status),
    ...quizzes.map((item) => item.status),
  ];

  return {
    course,
    learningPath,
    lessons,
    summary: {
      lessons: lessons.length,
      contents: contents.length,
      assignments: assignments.length,
      quizzes: quizzes.length,
      draftItems: statuses.filter(
        (status) => status === "DRAFT",
      ).length,
      publishedItems: statuses.filter(
        (status) => status === "PUBLISHED",
      ).length,
    },
  };
}
