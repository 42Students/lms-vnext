/** Miniature member point history uses immutable completed sprint sign-offs.
 * Missing sprint snapshots are OMITTED, never represented as zero earned.
 */
export type MentorSprintSparkBar={
 sprintId:string;sequence:number;donePoints:number;plannedPoints:number;
 doneHeightPct:number;plannedHeightPct:number;
};
export function mentorSprintPointSparkline(rows:readonly {
 sprintId:string;sequence:number;donePoints:number;plannedPoints:number;
}[]):MentorSprintSparkBar[]{
 const sorted=[...rows].filter(row=>
   Number.isSafeInteger(row.sequence)&&
   Number.isFinite(row.plannedPoints)&&row.plannedPoints>=0&&
   Number.isFinite(row.donePoints)&&row.donePoints>=0&&
   row.donePoints<=row.plannedPoints)
   .sort((a,b)=>a.sequence-b.sequence||a.sprintId.localeCompare(b.sprintId))
   .slice(-4);
 const max=Math.max(1,...sorted.map(row=>row.plannedPoints));
 return sorted.map(row=>({
  ...row,doneHeightPct:Math.round(row.donePoints/max*100),
  plannedHeightPct:Math.round(row.plannedPoints/max*100),
 }));
}
