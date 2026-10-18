import { learnerAssignmentPublishedGradeLabel } from "./learner-assignment-grade-label-model";
/** Pure deadline/grade display policy for the learner's aggregate Assignments page. */
export type AssignmentDisplayInput = {
  submittedAt: string | null;
  dueAt: string | null;
  gradePublished: boolean;
  pointsAwarded: number | null;
  maxPoints: number;
};

export function assignmentOverviewState(item: AssignmentDisplayInput, nowMs: number) {
  if (item.gradePublished) {
    return {
      label: learnerAssignmentPublishedGradeLabel(item.pointsAwarded,item.maxPoints),
      tone: "success" as const,
      action: "View" as const,
    };
  }
  if (item.submittedAt) {
    const due = item.dueAt ? new Date(item.dueAt).getTime() : null;
    const submitted = new Date(item.submittedAt).getTime();
    const submittedLate = Boolean(due && Number.isFinite(submitted) && submitted > due);
    return {
      label: submittedLate ? "Submitted late · awaiting grade" : "Submitted · awaiting grade",
      tone: "info" as const,
      action: "View" as const,
    };
  }
  const due = item.dueAt ? new Date(item.dueAt).getTime() : null;
  if (due === null || !Number.isFinite(due)) {
    return { label: "Submission unavailable · deadline missing", tone: "warning" as const, action: "View" as const };
  }
  if (due <= nowMs) {
    return { label: "Closed · not submitted", tone: "warning" as const, action: "View" as const };
  }
  if (due && due - nowMs < 48 * 60 * 60 * 1000) {
    return { label: "Due soon", tone: "warning" as const, action: "Submit" as const };
  }
  return { label: "Not submitted", tone: "neutral" as const, action: "Submit" as const };
}
