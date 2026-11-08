"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Attendance policy unavailable"
    description="The college attendance policy could not load. No settings were changed by this error screen."
    action={<div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink variant="secondary" href="/college/attendance" className="min-h-11 w-full sm:w-auto">Back to attendance</ButtonLink></div>}/>;
}
