"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Elective allocation unavailable" description="The eligible student allocation list could not load. No students were allocated by this error screen."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/>;
}
