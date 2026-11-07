"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error;reset:()=>void}){
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Round results"/>
  <ErrorState title="Round results could not load"
   description="We could not verify the selected drive and round results. This does not mean any results were lost or changed."
   action={<Button type="button" variant="secondary" onClick={reset}>Try again</Button>}/>
 </div>;
}
