"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function DepartmentsError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Could not load departments"
    description="We couldn't load departments. Please try again."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/>;
}
