"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
export default function CollegeProgramsError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 space-y-6"><PageHeader title="Programs" /><ErrorState title="Programs unavailable"
  description="The college program directory could not be loaded. No empty-result conclusion is assumed."
  action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/></div>;
}
