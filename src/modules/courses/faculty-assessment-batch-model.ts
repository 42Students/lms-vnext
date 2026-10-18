/**
 * FAC-assessments-R04: only shared-offering rows or the actor's assigned
 * delivery may reach an assessment index. A sibling class is never visible.
 */
export function facultyAssessmentVisibleToDelivery(
  item: { deliveryId: string | null },
  authorizedDeliveryId: string,
): boolean {
  return item.deliveryId === null || item.deliveryId === authorizedDeliveryId;
}

/** Sequence positions may exceed V8's function-argument limit on large courses. */
export function nextFacultyLessonContentSequence(sequences:readonly number[]):number {
 let max=-1;
 for(const sequence of sequences){
  if(!Number.isSafeInteger(sequence)||sequence<0)
   throw new RangeError("INVALID_FACULTY_LESSON_SEQUENCE");
  if(sequence>max)max=sequence;
 }
 if(max===Number.MAX_SAFE_INTEGER)
  throw new RangeError("INVALID_FACULTY_LESSON_SEQUENCE");
 return max+1;
}
