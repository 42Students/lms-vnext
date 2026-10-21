import { z } from "zod";

/** Historic course search accepts up to 200 characters. Oversized queries
 * are errors, never converted to blank (which would reveal default results). */
const querySchema=z.string().trim().max(200,"Search must be 200 characters or fewer");
export const LEGACY_COURSE_SEARCH_SYNONYMS:Readonly<Record<string,string>>={
 cs:"computer science",ds:"data structures",algo:"algorithms",
 ml:"machine learning",ai:"artificial intelligence",
 dbms:"database management",os:"operating systems",
 cn:"computer networks",se:"software engineering",
 oop:"object oriented programming",dsa:"data structures and algorithms",
 web:"web development",app:"application",dev:"development",prog:"programming",
};
function courseSearchQuery(raw:unknown){
 return querySchema.parse(typeof raw==="string"?raw:"").toLocaleLowerCase("en-IN");
}

export function learnerCourseMatchesSearch(
  row: { course: { courseName: string; courseCode: string; programName: string; sectionName: string; cohortName?:string; academicPeriodName: string; periodStartDate?:string; periodEndDate?:string }; instructorNames: readonly string[] },
  rawQuery: unknown,
): boolean {
  const needle=courseSearchQuery(rawQuery);
  if(!needle)return true;
  const expanded=LEGACY_COURSE_SEARCH_SYNONYMS[needle];
  const queries=expanded?[needle,expanded]:[needle];
  return [
    row.course.courseName, row.course.courseCode, row.course.programName,
    row.course.sectionName, row.course.cohortName??"", row.course.academicPeriodName,
    row.course.periodStartDate?.slice(0,4)??"",row.course.periodEndDate?.slice(0,4)??"",
    ...row.instructorNames,
  ].some(value=>queries.some(query=>value.toLocaleLowerCase("en-IN").includes(query)));
}

/** Weighted local autocomplete. Legacy's project-wide usage counts and
 * custom synonym dictionary are not present in scoped learner course data.
 * Optional usage boosts must be supplied only from authorized usage counts.
 */
export function learnerCourseSearchScore(value:string,needle:string,usage=0):number{
 const hay=value.trim().toLocaleLowerCase("en-IN"),q=needle.trim().toLocaleLowerCase("en-IN");
 const expanded=LEGACY_COURSE_SEARCH_SYNONYMS[q];
 if(!q)return 0;
 const bonus=Math.min(20,Math.max(0,Math.floor(usage)));
 if(hay===q)return 100+bonus;
 if(hay.startsWith(q))return 80+bonus;
 if(hay.includes(q))return 60+bonus;
 if(expanded&&hay===expanded)return 95+bonus;
 if(expanded&&hay.startsWith(expanded))return 75+bonus;
 if(expanded&&hay.includes(expanded))return 55+bonus;
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
}>(
 rows:readonly T[],raw:unknown,
 options:{scope?:"ASSIGNED"|"GLOBAL";usageByCode?:ReadonlyMap<string,number>;limit?:number}={},
):T[]{
 const q=courseSearchQuery(raw);
 const limit=options.limit===undefined?rows.length:Math.max(0,Math.min(1000,Math.trunc(options.limit)));
 if(!q){
  const defaults=[...rows];
  if(options.scope==="GLOBAL")defaults.sort((a,b)=>
   (options.usageByCode?.get(b.course.courseCode)??0)-
   (options.usageByCode?.get(a.course.courseCode)??0)||
   a.course.courseName.localeCompare(b.course.courseName));
  return defaults.slice(0,limit);
 }
 return rows.map(row=>({row,score:Math.max(...[
  row.course.courseName,row.course.courseCode,row.course.programName,
  row.course.sectionName,row.course.cohortName??"",row.course.academicPeriodName,
  ...row.instructorNames,
 ].map(value=>learnerCourseSearchScore(value,q)))}))
 .filter(item=>item.score>0)
 .sort((left,right)=>right.score-left.score||
  left.row.course.courseName.localeCompare(right.row.course.courseName))
 .slice(0,limit).map(item=>item.row);
}
