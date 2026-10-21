"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import {useLastCollegeProgressReport} from "@/components/courses/college-progress-last-good";

export default function CollegeCourseProgressError({error,reset}:{
 error:Error & {digest?:string};reset:()=>void;
}){
 const prior=useLastCollegeProgressReport();
 // Match only recognized internal metadata failures. Do not echo raw error text.
 const metadataFailed=error.message==="COURSE_PROGRESS_FILTERS_UNAVAILABLE"||
   error.message==="COURSE_PROGRESS_METADATA_UNAVAILABLE";
 const message=metadataFailed
   ?"Some course-progress filters could not be loaded. Retry before selecting a class."
   :"Course progress report could not be loaded.";
 const reportMessage=metadataFailed?message:"Course progress report could not be loaded. Retry to see current results.";
 return <div className="min-w-0 space-y-4" role="alert">
   {prior?<section className="border-l-2 border-warning bg-warning-subtle p-3">
      <p className="text-sm font-semibold">{reportMessage}</p>
      <p className="mt-1 text-xs text-muted-foreground">Showing the last successful report in this same authorized college workspace. It may be out of date.</p>
      <Button type="button" variant="secondary" onClick={reset} className="mt-3 min-h-11 md:min-h-9">Retry</Button>
    </section>:
    <ErrorState title={metadataFailed?"Course-progress filters unavailable":"Course progress unavailable"}
      description={reportMessage}
      action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/>}
   {prior?<section aria-label="Last successful course-progress report">{prior}</section>:null}
 </div>;
}
