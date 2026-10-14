import { z } from "zod";
import { facultyGradeHasChanges } from "./faculty-grade-noop-model";

type SavedGrade = {
  gradingStatus: string;
  pointsAwarded: number | null;
  feedback: string | null;
  gradePublished: boolean;
};

/** An empty numeric field is not a zero; publication uses saved values only. */
export function facultyGradeEditorState(
  current: SavedGrade, rawPoints: string, feedback: string, maxPoints: number,
) {
  const parsed = z.string().trim().min(1)
    .transform((value) => Number(value)).pipe(z.number().int().min(0).max(maxPoints)).safeParse(rawPoints);
  const points = parsed.success ? parsed.data : null;
  const hasChanges = points === null || facultyGradeHasChanges(current, {
    pointsAwarded: points, feedback,
  });
  return {
    points,
    hasChanges,
    canPublish: current.gradingStatus === "GRADED" && !current.gradePublished && !hasChanges,
  };
}
