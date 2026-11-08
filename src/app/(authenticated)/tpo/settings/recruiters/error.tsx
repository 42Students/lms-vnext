"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import {TextLink} from "@/components/ui/text-link";
export default function TpoRecruiterAccessError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <ErrorState title="Couldn't load recruiter access"
  description="The college's recruiter grants could not be retrieved. No active access or revoked-access conclusion has been inferred from this failure."
  action={<div className="flex min-w-0 flex-wrap items-center gap-3"><Button className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button><TextLink href="/tpo/settings" className="inline-flex min-h-11 items-center md:min-h-9">Back to settings</TextLink></div>}/>;
}
