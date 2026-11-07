"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
export default function Error({reset}:{error:Error;reset:()=>void}){
 return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
  <PageHeader title="Round results"/>
  <ErrorState title="Round results could not load"
   description="We could not verify the selected drive and round results. This does not mean any results were lost or changed."
   action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Try again</Button><TextLink href="/hr/drives" className="inline-flex min-h-11 items-center md:min-h-9">Back to drives</TextLink></span>}/>
 </div>;
}
