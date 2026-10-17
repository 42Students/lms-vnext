import { and, asc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseAssignments, courseLearningPaths, courseLessons, courseQuizzes, lessonContents,
} from "@/db/schema";
import { listFacultyCourseDeliveries } from "./faculty-course-service";
import { facultyAssessmentVisibleToDelivery } from "./faculty-assessment-batch-model";
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
      academicPeriodName: string; lessonName: string; facultyOwned: boolean;
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
        assignmentAudience, ne(courseAssignments.status, "ARCHIVED"))),
    getDb().select().from(courseQuizzes)
      .where(and(inArray(courseQuizzes.lessonId, lessonIds),
        quizAudience, ne(courseQuizzes.status, "ARCHIVED"))),
    getDb().select({lessonId:lessonContents.lessonId,deliveryId:lessonContents.deliveryId,
      sequence:lessonContents.sequence}).from(lessonContents)
      .where(and(inArray(lessonContents.lessonId, lessonIds),
        contentAudience, ne(lessonContents.status,"ARCHIVED"))),
  ]);

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
        nextSequence: sequences.length ? Math.max(...sequences) + 1 : 0,
      });
      for (const item of assignments) empty.assignments.push({
        ...item, kind:"ASSIGNMENT", deliveryId:course.deliveryId,
        authoredDeliveryId:item.deliveryId, courseName:course.courseName,
        courseCode:course.courseCode, sectionName:course.sectionName,
        sectionCode:course.sectionCode, academicPeriodName:course.academicPeriodName,
        lessonName:lesson.name, facultyOwned:item.deliveryId===course.deliveryId,
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

  const orderByDueTitle = <T extends {dueAt:Date|null;title:string}>(a:T,b:T) =>
    (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
    (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) ||
    a.title.localeCompare(b.title);
  empty.assignments.sort(orderByDueTitle);
  empty.quizzes.sort(orderByDueTitle);
  return empty;
}
