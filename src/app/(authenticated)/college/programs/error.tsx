"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegeProgramsError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <ErrorState title="Programs unavailable"
  description="The college program directory could not be loaded. No empty-result conclusion is assumed."
  action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/>;
}
