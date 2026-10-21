import { and, asc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  assignmentSubmissions, courseAssignments, courseLearningPaths, courseLessons, courseQuizzes, lessonContents,
} from "@/db/schema";
import { listFacultyCourseDeliveries } from "./faculty-course-service";
import { facultyAssessmentVisibleToDelivery,nextFacultyLessonContentSequence } from "./faculty-assessment-batch-model";
import type { RequestContext } from "@/modules/identity/context";

/**
 * FAC-assessments-R04: the index views need assessment summaries, not an entire
 * faculty authoring workspace for every delivery. Resolve the actor's actual
 * active teaching deliveries first and batch the read across those offerings.
 * Section-local records must never be exposed to a sibling Section.
 */
export async function getFacultyAssessmentOverview(context: RequestContext) {
  const courses = await listFacultyCourseDeliveries(context);
  const empty = {
    courses: courses.map(course => ({
      deliveryId: course.deliveryId, courseCode: course.courseCode,
      courseName: course.courseName, sectionName: course.sectionName,
    })),
    lessonChoices: [] as Array<{
      deliveryId: string; courseCode: string; courseName: string;
      sectionName: string; lessonId: string; lessonName: string; nextSequence: number;
    }>,
    assignments: [] as Array<typeof courseAssignments.$inferSelect & {
      kind: "ASSIGNMENT"; authoredDeliveryId: string | null;
      courseName: string; courseCode: string; sectionName: string; sectionCode: string;
      academicPeriodName: string; lessonName: string; facultyOwned: boolean;hasSubmissions:boolean;
    } & {deliveryId: string}>,
    quizzes: [] as Array<typeof courseQuizzes.$inferSelect & {
      kind: "QUIZ"; authoredDeliveryId: string | null;
      courseName: string; courseCode: string; sectionName: string; sectionCode: string;
      academicPeriodName: string; lessonName: string; facultyOwned: boolean;
    } & {deliveryId: string}>,
  };
  if (courses.length === 0) return empty;

  // The first non-archived path is the same one used by the per-delivery
  // workspace. These IDs all originate from persisted active teaching grants.
  const offeringIds = [...new Set(courses.map(course => course.offeringId))];
  const paths = await getDb().select().from(courseLearningPaths)
    .where(and(inArray(courseLearningPaths.offeringId, offeringIds),
      ne(courseLearningPaths.status, "ARCHIVED")))
    .orderBy(asc(courseLearningPaths.createdAt), asc(courseLearningPaths.id));
  const firstPathByOffering = new Map<string, string>();
  for (const path of paths)
    if (!firstPathByOffering.has(path.offeringId))
      firstPathByOffering.set(path.offeringId, path.id);

  const pathIds = [...firstPathByOffering.values()];
  if (pathIds.length === 0) return empty;
  const lessons = await getDb().select().from(courseLessons)
    .where(and(inArray(courseLessons.learningPathId, pathIds),
      eq(courseLessons.status, "ACTIVE")))
    .orderBy(asc(courseLessons.sequence), asc(courseLessons.name));
  if (lessons.length === 0) return empty;

  const lessonIds = lessons.map(lesson => lesson.id);
  const deliveryIds = courses.map(course => course.deliveryId);
  const assignmentAudience = or(isNull(courseAssignments.deliveryId),
    inArray(courseAssignments.deliveryId, deliveryIds));
  const quizAudience = or(isNull(courseQuizzes.deliveryId),
    inArray(courseQuizzes.deliveryId, deliveryIds));
  const contentAudience = or(isNull(lessonContents.deliveryId),
    inArray(lessonContents.deliveryId, deliveryIds));

  const [assignmentRows, quizRows, contentOrders] = await Promise.all([
    getDb().select().from(courseAssignments)
      .where(and(inArray(courseAssignments.lessonId, lessonIds),
        assignmentAudience)),
    getDb().select().from(courseQuizzes)
      .where(and(inArray(courseQuizzes.lessonId, lessonIds),
        quizAudience)),
    getDb().select({lessonId:lessonContents.lessonId,deliveryId:lessonContents.deliveryId,
      sequence:lessonContents.sequence}).from(lessonContents)
      .where(and(inArray(lessonContents.lessonId, lessonIds),
        contentAudience, ne(lessonContents.status,"ARCHIVED"))),
  ]);

  // FAC-assessments-15: one scoped aggregate read, no per-card submission query.
  // The faculty editor can display the lock *before* a rejected save.
  const assignmentIds=[...new Set(assignmentRows.map(row=>row.id))];
  const submittedRows=assignmentIds.length?await getDb().select({
    assignmentId:assignmentSubmissions.assignmentId,
  }).from(assignmentSubmissions)
    .where(inArray(assignmentSubmissions.assignmentId,assignmentIds))
    .groupBy(assignmentSubmissions.assignmentId):[];
  const submittedIds=new Set(submittedRows.map(row=>row.assignmentId));

  const lessonByPath = new Map<string, typeof lessons>();
  for (const lesson of lessons) {
    const group = lessonByPath.get(lesson.learningPathId) ?? [];
    group.push(lesson);
    lessonByPath.set(lesson.learningPathId, group);
  }
  const assignmentByLesson = new Map<string, typeof assignmentRows>();
  for (const item of assignmentRows) {
    const group = assignmentByLesson.get(item.lessonId) ?? [];
    group.push(item); assignmentByLesson.set(item.lessonId, group);
  }
  const quizByLesson = new Map<string, typeof quizRows>();
  for (const item of quizRows) {
    const group = quizByLesson.get(item.lessonId) ?? [];
    group.push(item); quizByLesson.set(item.lessonId, group);
  }
  const contentByLesson = new Map<string, typeof contentOrders>();
  for (const item of contentOrders) {
    const group = contentByLesson.get(item.lessonId) ?? [];
    group.push(item); contentByLesson.set(item.lessonId, group);
  }

  for (const course of courses) {
    const pathId = firstPathByOffering.get(course.offeringId);
    if (!pathId) continue;
    for (const lesson of lessonByPath.get(pathId) ?? []) {
      const visibleToDelivery = (item:{deliveryId:string|null}) =>
        facultyAssessmentVisibleToDelivery(item, course.deliveryId);
      const assignments = (assignmentByLesson.get(lesson.id) ?? []).filter(visibleToDelivery);
      const quizzes = (quizByLesson.get(lesson.id) ?? []).filter(visibleToDelivery);
      const sequences = [
        ...(contentByLesson.get(lesson.id) ?? []).filter(visibleToDelivery).map(item=>item.sequence),
        ...assignments.map(item=>item.sequence),
        ...quizzes.map(item=>item.sequence),
      ];
      empty.lessonChoices.push({
        deliveryId: course.deliveryId, courseCode: course.courseCode,
        courseName: course.courseName, sectionName: course.sectionName,
        lessonId: lesson.id, lessonName: lesson.name,
        nextSequence: nextFacultyLessonContentSequence(sequences),
      });
      for (const item of assignments) empty.assignments.push({
        ...item, kind:"ASSIGNMENT", deliveryId:course.deliveryId,
        authoredDeliveryId:item.deliveryId, courseName:course.courseName,
        courseCode:course.courseCode, sectionName:course.sectionName,
        sectionCode:course.sectionCode, academicPeriodName:course.academicPeriodName,
        lessonName:lesson.name, facultyOwned:item.deliveryId===course.deliveryId,
        hasSubmissions:submittedIds.has(item.id),
      });
      for (const item of quizzes) empty.quizzes.push({
        ...item, kind:"QUIZ", deliveryId:course.deliveryId,
        authoredDeliveryId:item.deliveryId, courseName:course.courseName,
        courseCode:course.courseCode, sectionName:course.sectionName,
        sectionCode:course.sectionCode, academicPeriodName:course.academicPeriodName,
        lessonName:lesson.name, facultyOwned:item.deliveryId===course.deliveryId,
      });
    }
  }

  // The legacy quiz repository orders by newest created first; the vNext
  // page already paginates the scoped collection in slices of 20.
  const newestFirst = <T extends {createdAt:Date;id:string}>(a:T,b:T) =>
    b.createdAt.getTime()-a.createdAt.getTime() || b.id.localeCompare(a.id);
  empty.assignments.sort(newestFirst);
  empty.quizzes.sort(newestFirst);
  return empty;
}
