import { Select } from "@/components/ui/select";
type Item={code:string;name:string};
export function SuperAdminLearningFilterFields({courses,cohorts,selectedCourse,selectedCohort}:{
 courses:readonly Item[];cohorts:readonly Item[];
 selectedCourse?:string;selectedCohort?:string;
}){
 const css="min-h-11 w-full sm:min-h-9";
 return <>
  <label className="grid gap-1 text-sm font-semibold text-body">Choose course
   <Select name="courseCode" defaultValue={selectedCourse??""} className={css}>
    <option value="">All courses</option>{courses.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </Select>
  </label>
  <label className="grid gap-1 text-sm font-semibold text-body">Choose batch
   <Select name="cohortCode" defaultValue={selectedCohort??""} className={css}>
    <option value="">All batches</option>{cohorts.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </Select>
  </label>
 </>;
}
