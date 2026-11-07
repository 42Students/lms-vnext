"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";
export default function CollegeVideosError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 space-y-6"><PageHeader title="Video" /><ErrorState title="Videos unavailable"
  description="Content metadata could not be loaded. No empty-result conclusion is assumed."
  action={<div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="secondary" className="min-h-11" onClick={reset}>Retry</Button><ButtonLink variant="secondary" href="/college/lessons" className="min-h-11">Lessons</ButtonLink></div>}/></div>;
}
