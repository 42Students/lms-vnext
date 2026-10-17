import "server-only";

import { and, asc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  courseLearningPaths,
  courseLessons,
  lessonContents,
  courseAssignments,
  courseQuizzes,
} from "@/db/schema";
import type { listFacultyCourseDeliveries } from "./faculty-course-service";
import { countFacultyCourseCardItems } from "./faculty-course-card-summary-model";

type AssignedCourse = Awaited<ReturnType<typeof listFacultyCourseDeliveries>>[number];

export type FacultyCourseCardSummary = {
  learningPath: typeof courseLearningPaths.$inferSelect | null;
  summary: {
    lessons: number;
    contents: number;
    assignments: number;
    quizzes: number;
    draftItems: number;
    publishedItems: number;
  };
};

function emptySummary(): FacultyCourseCardSummary["summary"] {
  return {
    lessons: 0, contents: 0, assignments: 0, quizzes: 0,
    draftItems: 0, publishedItems: 0,
  };
}

/**
 * FAC-courses-09: the assigned deliveries were already authorised by
 * listFacultyCourseDeliveries; page cards only need path and three counters.
 * Batch the bounded page IDs instead of fetching full workspaces 48 times.
 */
export async function listFacultyCourseCardSummaries(
  assigned: readonly AssignedCourse[],
): Promise<Map<string, FacultyCourseCardSummary>> {
  const result = new Map<string, FacultyCourseCardSummary>();
  if (!assigned.length) return result;
  const offeringIds = [...new Set(assigned.map((course) => course.offeringId))];
  const paths = await getDb().select().from(courseLearningPaths)
    .where(and(
      inArray(courseLearningPaths.offeringId, offeringIds),
      ne(courseLearningPaths.status, "ARCHIVED"),
    ))
    .orderBy(asc(courseLearningPaths.createdAt));
  const firstByOffering = new Map<string, typeof paths[number]>();
  for (const path of paths) {
    if (!firstByOffering.has(path.offeringId)) firstByOffering.set(path.offeringId, path);
  }
  for (const course of assigned) {
    result.set(course.deliveryId, {
      learningPath: firstByOffering.get(course.offeringId) ?? null,
      summary: emptySummary(),
    });
  }
  const pathIds = [...new Set([...firstByOffering.values()].map((path) => path.id))];
  if (!pathIds.length) return result;
  const lessons = await getDb().select({ id: courseLessons.id, learningPathId: courseLessons.learningPathId })
    .from(courseLessons)
    .where(and(inArray(courseLessons.learningPathId, pathIds), eq(courseLessons.status, "ACTIVE")));
  const lessonIds = lessons.map((lesson) => lesson.id);
  if (!lessonIds.length) return result;
  const [contents, assignments, quizzes] = await Promise.all([
    getDb().select({ lessonId: lessonContents.lessonId, deliveryId: lessonContents.deliveryId, status: lessonContents.status })
      .from(lessonContents).where(and(inArray(lessonContents.lessonId, lessonIds), ne(lessonContents.status, "ARCHIVED"))),
    getDb().select({ lessonId: courseAssignments.lessonId, deliveryId: courseAssignments.deliveryId, status: courseAssignments.status })
      .from(courseAssignments).where(and(inArray(courseAssignments.lessonId, lessonIds), ne(courseAssignments.status, "ARCHIVED"))),
    getDb().select({ lessonId: courseQuizzes.lessonId, deliveryId: courseQuizzes.deliveryId, status: courseQuizzes.status })
      .from(courseQuizzes).where(and(inArray(courseQuizzes.lessonId, lessonIds), ne(courseQuizzes.status, "ARCHIVED"))),
  ]);
  const lessonSetByPath = new Map<string, Set<string>>();
  for (const lesson of lessons) {
    const set = lessonSetByPath.get(lesson.learningPathId) ?? new Set<string>();
    set.add(lesson.id);
    lessonSetByPath.set(lesson.learningPathId, set);
  }
  for (const course of assigned) {
    const card = result.get(course.deliveryId);
    if (!card?.learningPath) continue;
    const set = lessonSetByPath.get(card.learningPath.id) ?? new Set<string>();
    card.summary = countFacultyCourseCardItems({
      lessonIds: set, deliveryId: course.deliveryId,
      contents, assignments, quizzes,
    });
  }
  return result;
}
