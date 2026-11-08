"use client";
import { ButtonLink } from "@/components/ui/button-link";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
export default function CollegeProgramsError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 space-y-6"><PageHeader title="Programs" /><ErrorState title="Programs unavailable"
  description="The college program directory could not be loaded. No empty-result conclusion is assumed."
  action={<><Button className="min-h-11 md:min-h-9" type="button" variant="secondary" onClick={reset}>Retry</Button><ButtonLink href="/college" variant="secondary">College home</ButtonLink></>}/></div>;
}
