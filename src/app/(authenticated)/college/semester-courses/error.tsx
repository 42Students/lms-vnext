"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function SemesterCoursesError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 space-y-6"><PageHeader title="Semester–Course Mapping" /><ErrorState title="Couldn't refresh semester course mapping"
  description="The refresh failed. No empty mapping should replace the previous term's records. Retry to load this term."
  action={<Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>}/></div>;
}
