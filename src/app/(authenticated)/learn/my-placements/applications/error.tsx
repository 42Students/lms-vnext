"use client";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
/** A failed journey read must not be displayed as an empty applications list. */
export default function LearnerApplicationsError({reset}:{
 error:Error&{digest?:string};reset:()=>void;
}){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Applications"/>
  <ErrorState title="Could not load applications"
   description="Your applications could not be loaded. No saved application was changed."
   action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/>
 </div>;
}
