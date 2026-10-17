type Item={code:string;name:string};
export function SuperAdminLearningFilterFields({courses,cohorts,selectedCourse,selectedCohort}:{
 courses:readonly Item[];cohorts:readonly Item[];
 selectedCourse?:string;selectedCohort?:string;
}){
 const css="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-foreground";
 return <>
  <label className="grid gap-1 text-sm font-semibold text-body">Choose course
   <select name="courseCode" defaultValue={selectedCourse??""} className={css}>
    <option value="">All courses</option>{courses.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </select>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">Choose batch
   <select name="cohortCode" defaultValue={selectedCohort??""} className={css}>
    <option value="">All batches</option>{cohorts.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </select>
  </label>
 </>;
}
