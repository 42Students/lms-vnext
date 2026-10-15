import {z} from "zod";
const modeSchema=z.enum(["NAME","PROGRESS","DUE","RECENT"]).catch("NAME");
export type LearnerCourseSortMode=z.infer<typeof modeSchema>;
type CourseCard={
 course:{deliveryId:string;offeringType:string;courseName:string};
 summary:{overallPercent:number|null};
 nextDue:{dueAt:string}|null;
 lastActivity?:string|null;
};
/** Preserve legacy regular-before-elective grouping with alternate within-group order. */
export function sortLearnerCourseCards<T extends CourseCard>(
 rows:readonly T[],modeInput:unknown,
):T[]{
 const mode=modeSchema.parse(modeInput);
 const deadline=(row:T)=>row.nextDue?Date.parse(row.nextDue.dueAt):Number.POSITIVE_INFINITY;
 return [...rows].sort((a,b)=>{
  const elective=Number(a.course.offeringType.toUpperCase()==="ELECTIVE")-
   Number(b.course.offeringType.toUpperCase()==="ELECTIVE");
  if(elective)return elective;
  if(mode==="PROGRESS"){
   const x=a.summary.overallPercent,y=b.summary.overallPercent;
   if(x===null&&y!==null)return 1;
   if(y===null&&x!==null)return -1;
   if(x!==null&&y!==null&&x!==y)return x-y;
  }
  if(mode==="RECENT"){
   const left=a.lastActivity?Date.parse(a.lastActivity):Number.NaN;
   const right=b.lastActivity?Date.parse(b.lastActivity):Number.NaN;
   const x=Number.isFinite(left)?left:Number.NEGATIVE_INFINITY;
   const y=Number.isFinite(right)?right:Number.NEGATIVE_INFINITY;
   if(x!==y)return y-x;
  }
  if(mode==="DUE"){
   const x=deadline(a),y=deadline(b);
   const first=Number.isFinite(x)?x:Number.POSITIVE_INFINITY;
   const second=Number.isFinite(y)?y:Number.POSITIVE_INFINITY;
   if(first!==second)return first-second;
  }
  return a.course.courseName.localeCompare(b.course.courseName)||
   a.course.deliveryId.localeCompare(b.course.deliveryId);
 });
}
