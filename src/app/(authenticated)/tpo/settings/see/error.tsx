"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoWhatCompaniesSeeError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="What companies see"
  description="Unable to load company visibility settings. Your college's sharing restrictions are unchanged; we will not show additional learner data while this policy is unavailable."
  action={<Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/>;
}
