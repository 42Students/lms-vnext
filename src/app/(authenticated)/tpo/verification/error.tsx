"use client";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import {Button} from "@/components/ui/button";
export default function TpoVerificationError({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3 py-6">
  <PageHeader title={"Could not load verification"} />
  <p className="text-sm">This information is temporarily unavailable. Your filters are still selected.</p>
  <div className="flex flex-wrap gap-3">
   <Button variant="secondary" type="button" onClick={reset} >Retry verification</Button>
   <PageBackLink href="/tpo/students" label="Back to students" />
  </div>
 </section>;
}