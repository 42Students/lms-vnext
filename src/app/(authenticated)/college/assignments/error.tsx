"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function CollegeAssignmentsError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Assignments unavailable"
    description="College assignments could not be loaded. No empty-result conclusion is assumed."
    action={<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button><ButtonLink variant="secondary" href="/dashboard" className="min-h-11 w-full sm:w-auto">Back to dashboard</ButtonLink></div>}/>;
}
