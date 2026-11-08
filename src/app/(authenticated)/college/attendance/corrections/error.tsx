"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {ErrorState} from "@/components/ui/error-state";
export default function CollegeCorrectionReadError({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}) {
  return <ErrorState title="Attendance correction evidence unavailable"
    description="The college attendance records could not be loaded. A missing result is not assumed."
    action={<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink variant="secondary" href="/college/attendance" className="min-h-11 w-full sm:w-auto">Back to attendance</ButtonLink></div>}/>;
}
