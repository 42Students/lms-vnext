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

/** COL-course-tabs-14: optimistic compare-and-swap for one whole lesson order. */
export const collegeLessonBulkOrderSchema=z.strictObject({
 learningPathId:z.string().uuid(),
 expected:z.array(z.strictObject({id:z.string().uuid(),sequence:z.number().int().nonnegative()})).min(1).max(1000),
 orderedIds:z.array(z.string().uuid()).min(1).max(1000),
}).superRefine((input,ctx)=>{
 const original=input.expected.map(row=>row.id);
 if(new Set(original).size!==original.length||
    input.orderedIds.length!==original.length||
    new Set(input.orderedIds).size!==input.orderedIds.length||
    input.orderedIds.some(id=>!original.includes(id)))
   ctx.addIssue({code:"custom",path:["orderedIds"],message:"Lesson set must match the saved order"});
});
export function rearrangeLessonIds(ids:readonly string[],sourceId:string,targetId:string){
 if(!ids.includes(sourceId)||!ids.includes(targetId)||sourceId===targetId)return [...ids];
 const originalIndex=ids.indexOf(sourceId);
 const targetIndex=ids.indexOf(targetId);
 const next=ids.filter(id=>id!==sourceId);
 const insertion=next.indexOf(targetId)+(originalIndex<targetIndex?1:0);
 next.splice(insertion,0,sourceId);
 return next;
}
