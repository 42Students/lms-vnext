"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}){
  return <div className="min-w-0 space-y-6"><PageHeader title="Profile verification" /><ErrorState title="Verification unavailable"
    description="Requests could not be loaded. No verification decisions were made."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>} /></div>;
}
