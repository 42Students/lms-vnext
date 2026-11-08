"use client";
import { ButtonLink } from "@/components/ui/button-link";
import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
export default function ChangeRequestsError({reset}:{error:Error&{digest?:string};reset:()=>void}){
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Change requests"/>
  <Alert tone="error" title="Could not load change requests">
   The drive change requests could not be loaded. No pending request or reply was changed.
  </Alert>
  <Button type="button" variant="secondary" onClick={()=>reset()}>Retry change requests</Button>
   <ButtonLink variant="secondary" href="/tpo/placements" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to placements</ButtonLink>
 </div>;
}
