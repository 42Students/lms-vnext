import { z } from "zod";

export const learnerAttendanceMonthSchema = z.string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use YYYY-MM");

export type LearnerLessonProgressInput = {
  id: string;
  name: string;
  sequence: number;
  items: readonly {
    id: string;
    title: string;
    kind: "CONTENT" | "ASSIGNMENT" | "QUIZ";
    progress: { status: string };
  }[];
};

export function buildLearnerLessonProgress(
  lessons: readonly LearnerLessonProgressInput[],
) {
  return lessons.map((lesson) => {
    const total = lesson.items.length;
    const completed = lesson.items.filter(
      (item) => item.progress.status === "COMPLETED",
    ).length;
    const inProgress = lesson.items.filter(
      (item) => item.progress.status === "IN_PROGRESS",
    ).length;
    const missed = lesson.items.filter(
      (item) => item.progress.status === "MISSED",
    ).length;
    return {
      id: lesson.id,
      name: lesson.name,
      sequence: lesson.sequence,
      total,
      completed,
      inProgress,
      missed,
      percentage: total === 0 ? null : Math.round(100 * completed / total),
      items: lesson.items.map((item) => ({
        id: item.id,
        title: item.title,
        kind: item.kind,
        status: item.progress.status,
      })),
    };
  }).sort((a, b) => a.sequence - b.sequence || a.id.localeCompare(b.id));
}

export type LearnerCourseAttendanceRecord = {
  id: string;
  startsAt: Date;
  title: string;
  status: "PRESENT" | "ABSENT" | "EXCUSED" | "MEDICAL" | "LATE" |
    "NOT_MARKED" | "SCHEDULED";
};

function indiaMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  return year + "-" + month;
}

/**
 * Each course/month summary uses only recorded schedule and attendance
 * states. Scheduled classes are excluded from marked-attendance denominators;
 * not-marked classes remain unknown rather than being treated as absences.
 */
export function buildLearnerCourseAttendanceMonths(
  records: readonly LearnerCourseAttendanceRecord[],
) {
  const grouped = new Map<string, LearnerCourseAttendanceRecord[]>();
  for (const record of records) {
    if (!Number.isFinite(record.startsAt.getTime())) continue;
    const month = indiaMonth(record.startsAt);
    grouped.set(month, [...(grouped.get(month) ?? []), record]);
  }
  return [...grouped].map(([month, rows]) => {
    const held = rows.filter((row) => row.status !== "SCHEDULED");
    const marked = held.filter((row) => row.status !== "NOT_MARKED");
    const present = marked.filter((row) => row.status === "PRESENT").length;
    return {
      month,
      scheduled: rows.length - held.length,
      held: held.length,
      marked: marked.length,
      notMarked: held.length - marked.length,
      present,
      otherMarked: marked.length - present,
      percentage: marked.length ? Math.round(100 * present / marked.length) : null,
      records: [...rows].sort((a, b) =>
        b.startsAt.getTime() - a.startsAt.getTime() || a.id.localeCompare(b.id),
      ),
    };
  }).sort((a, b) => b.month.localeCompare(a.month));
}
