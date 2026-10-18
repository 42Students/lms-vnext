"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegeVideosError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <ErrorState title="Videos unavailable"
  description="Content metadata could not be loaded. No empty-result conclusion is assumed."
  action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/>;
}
