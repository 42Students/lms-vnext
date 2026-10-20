"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function SemesterCoursesError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 space-y-6"><PageHeader title="Semester–Course Mapping" /><ErrorState title="Course mappings unavailable"
  description="The mapping source could not be loaded. No zero-value conclusion is assumed."
  action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/></div>;
}
