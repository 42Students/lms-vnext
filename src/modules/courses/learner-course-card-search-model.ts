import { z } from "zod";

const querySchema = z.string().trim().transform((value) => value.slice(0, 100)).catch("");
export function learnerCourseMatchesSearch(
  row: { course: { courseName: string; courseCode: string; programName: string; sectionName: string; cohortName?:string; academicPeriodName: string; periodStartDate?:string; periodEndDate?:string }; instructorNames: readonly string[] },
  rawQuery: unknown,
): boolean {
  const needle = querySchema.parse(rawQuery).toLocaleLowerCase("en-IN");
  if (!needle) return true;
  return [
    row.course.courseName, row.course.courseCode, row.course.programName,
    row.course.sectionName, row.course.cohortName??"", row.course.academicPeriodName,
    row.course.periodStartDate?.slice(0,4)??"",row.course.periodEndDate?.slice(0,4)??"",
    ...row.instructorNames,
  ].some(value => value.toLocaleLowerCase("en-IN").includes(needle));
}

/** Weighted local autocomplete. Legacy's project-wide usage counts and
 * custom synonym dictionary are not present in scoped learner course data.
 * Optional usage boosts must be supplied only from authorized usage counts.
 */
export function learnerCourseSearchScore(value:string,needle:string,usage=0):number{
 const hay=value.trim().toLocaleLowerCase("en-IN"),q=needle.trim().toLocaleLowerCase("en-IN");
 if(!q)return 0;
 const bonus=Math.min(20,Math.max(0,Math.floor(usage)));
 if(hay===q)return 100+bonus;
 if(hay.startsWith(q))return 80+bonus;
 if(hay.includes(q))return 60+bonus;
 if(q.length<3)return 0;
 const words=hay.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
 function withinTwo(a:string,b:string):boolean{
  if(Math.abs(a.length-b.length)>2)return false;
  let previous=Array.from({length:b.length+1},(_,i)=>i);
  for(let i=1;i<=a.length;i++){
   const next=[i];
   for(let j=1;j<=b.length;j++){
    next[j]=Math.min(next[j-1]+1,previous[j]+1,
     previous[j-1]+(a[i-1]===b[j-1]?0:1));
   }
   if(Math.min(...next)>2)return false;
   previous=next;
  }
  return previous[b.length]<=2;
 }
 return words.some(word=>withinTwo(word,q))?40+bonus:0;
}
export function rankLearnerCourseAutocomplete<T extends {
 course:{courseName:string;courseCode:string;programName:string;
  sectionName:string;cohortName?:string;academicPeriodName:string};
 instructorNames:readonly string[];
}>(rows:readonly T[],raw:unknown):T[]{
 const q=querySchema.parse(raw);
 if(!q)return [...rows];
 return rows.map(row=>({row,score:Math.max(...[
  row.course.courseName,row.course.courseCode,row.course.programName,
  row.course.sectionName,row.course.cohortName??"",row.course.academicPeriodName,
  ...row.instructorNames,
 ].map(value=>learnerCourseSearchScore(value,q)))}))
 .filter(item=>item.score>0)
 .sort((left,right)=>right.score-left.score||
  left.row.course.courseName.localeCompare(right.row.course.courseName))
 .map(item=>item.row);
}
