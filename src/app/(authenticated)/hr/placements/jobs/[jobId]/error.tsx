"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
export default function HrJobError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}){
 return <section role="alert" className="space-y-4">
  <h1 className="text-[30px] font-semibold text-[var(--lms-heading)]">Drive details could not load</h1>
  <p className="mt-2 max-w-xl text-sm text-body">
   Some drive information may be stale or unavailable. We couldn&apos;t verify this drive right now. No applicant or offer details are
   shown until the employer and college access check succeeds.
  </p>
  <div className="mt-5 flex flex-wrap gap-3">
   <Button onClick={reset}>Retry drive details</Button>
   <Link href="/hr/drives" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] lms-inline-link">Back to Drives</Link>
  </div>
 </section>;
}
