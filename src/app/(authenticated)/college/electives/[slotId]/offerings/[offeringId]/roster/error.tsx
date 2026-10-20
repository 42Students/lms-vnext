"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Elective roster unavailable" description="The elective offering roster could not load. No membership changes were made by this error screen."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/>;
}
