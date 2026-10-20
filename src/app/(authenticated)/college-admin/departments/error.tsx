"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 max-w-full"><ErrorState title="Department directory unavailable" description="The department directory could not be loaded. No college data was changed."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full md:min-h-9 md:w-auto">Retry</Button>}/></div>;
}
