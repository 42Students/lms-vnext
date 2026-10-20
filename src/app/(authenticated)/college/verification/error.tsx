"use client";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <ErrorState title="Verification unavailable"
    description="Requests could not be loaded. No verification decisions were made."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} />;
}
