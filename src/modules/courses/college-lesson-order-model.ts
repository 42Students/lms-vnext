import { z } from "zod";

export const lessonMoveSchema = z.object({
  learningPathId: z.string().uuid(),
  lessonId: z.string().uuid(),
  expectedSequence: z.number().int().nonnegative(),
  direction: z.enum(["UP", "DOWN"]),
}).strict();

type LessonRow = { id: string; sequence: number };

export function planLessonMove(
  rows: readonly LessonRow[],
  input: z.infer<typeof lessonMoveSchema>,
): readonly [
  { id: string; previousSequence: number; sequence: number },
  { id: string; previousSequence: number; sequence: number },
] | null {
  const index = rows.findIndex(row => row.id === input.lessonId);
  if (index < 0 || rows[index].sequence !== input.expectedSequence) return null;
  const nextIndex = input.direction === "UP" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= rows.length) return null;
  const first = rows[index];
  const second = rows[nextIndex];
  if (first.sequence === second.sequence) return null;
  const park = Math.max(...rows.map(row => row.sequence)) + 1;
  return [
    { id: first.id, previousSequence: first.sequence, sequence: park },
    { id: second.id, previousSequence: second.sequence, sequence: first.sequence },
  ];
}
