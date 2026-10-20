"use client";
import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function TpoRequestsError({reset}:{reset:()=>void}){
 return <section role="alert" className="space-y-3">
  <PageHeader title={"Could not load requests"} />
  <ErrorState title="Could not load requests" description="Requests are temporarily unavailable. Your selected filters will be kept when you retry."
    action={<div className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" type="button" className="min-h-11 md:min-h-9" onClick={reset}>Retry requests</Button>
      <Link href="/tpo/students" className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Back to students</Link>
    </div>}/>
 </section>;
}
