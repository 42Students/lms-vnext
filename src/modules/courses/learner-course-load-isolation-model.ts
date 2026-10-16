/**
 * LEARNER-home-courses-R01: isolate course enrichment failures.
 * Source course-delivery rows have already been membership-authorized; never
 * surface rejection contents (which could contain internal DB details).
 */
export const LEARNER_UNAVAILABLE_COURSE_COPY =
  "Some course records have incomplete or duplicate information. Unavailable cards cannot be opened.";

export function partitionLearnerCourseLoads<T,C extends {deliveryId:string}>(
  courses:readonly C[], results:readonly PromiseSettledResult<T>[],
):{loaded:T[];failed:C[]}{
 if(courses.length!==results.length)throw new Error("COURSE_RESULT_COUNT_MISMATCH");
 const loaded:T[]=[];
 const failed:C[]=[];
 for(let i=0;i<courses.length;i++){
  const item=results[i]!;
  if(item.status==="fulfilled")loaded.push(item.value);
  else failed.push(courses[i]!);
 }
 return {loaded,failed};
}
