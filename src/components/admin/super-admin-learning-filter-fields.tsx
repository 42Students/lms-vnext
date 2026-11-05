import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
type Item={code:string;name:string};
export function SuperAdminLearningFilterFields({courses,cohorts,selectedCourse,selectedCohort}:{
 courses:readonly Item[];cohorts:readonly Item[];
 selectedCourse?:string;selectedCohort?:string;
}){
 const css="min-h-11 w-full md:min-h-9";
 return <>
  <Label stack>Choose course
   <Select name="courseCode" defaultValue={selectedCourse??""} className={css}>
    <option value="">All courses</option>{courses.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </Select>
  </Label>
  <Label stack>Choose batch
   <Select name="cohortCode" defaultValue={selectedCohort??""} className={css}>
    <option value="">All batches</option>{cohorts.map(item=><option value={item.code} key={item.code}>{item.name} ({item.code})</option>)}
   </Select>
  </Label>
 </>;
}
