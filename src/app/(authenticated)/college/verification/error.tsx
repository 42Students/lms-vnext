"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <div className="min-w-0 space-y-6"><PageHeader title="Profile verification" /><ErrorState title="Verification unavailable"
    description="Requests could not be loaded. No verification decisions were made."
    action={<div className="flex flex-col gap-2 sm:flex-row"><Button type="button" variant="secondary" onClick={reset} className="min-h-11">Retry</Button><ButtonLink variant="secondary" href="/college/students" className="min-h-11">Student directory</ButtonLink></div>} /></div>;
}
