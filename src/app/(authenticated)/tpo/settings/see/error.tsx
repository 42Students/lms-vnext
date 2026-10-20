"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoWhatCompaniesSeeError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load company visibility settings"
  description="The college's recruiter-sharing policy could not be retrieved. No default or permission state has been inferred from this failure."
  action={<Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry</Button>}/>;
}
