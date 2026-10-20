"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoRecruiterAccessError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load recruiter access"
  description="The college's recruiter grants could not be retrieved. No active access or revoked-access conclusion has been inferred from this failure."
  action={<Button variant="secondary" onClick={reset}>Retry</Button>}/>;
}
