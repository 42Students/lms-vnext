/** A published grade with missing marks cannot be displayed as a scored zero. */
export function learnerAssignmentPublishedGradeLabel(points:number|null,maxPoints:number):string {
  if(points===null||!Number.isFinite(points)||!Number.isFinite(maxPoints)||
    points<0||maxPoints<0)return "Graded · score unavailable";
  return `Graded · ${points}/${maxPoints}`;
}
