"use client";
import Link from "next/link";
import {Button} from "@/components/ui/button";
export default function HrJobError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}){
 return <section role="alert" className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
  <h1 className="text-lg font-semibold text-foreground">Drive details could not load</h1>
  <p className="mx-auto mt-2 max-w-xl text-sm text-body">
   Some drive information may be stale or unavailable. We couldn&apos;t verify this drive right now. No applicant or offer details are
   shown until the employer and college access check succeeds.
  </p>
  <div className="mt-5 flex flex-wrap justify-center gap-3">
   <Button onClick={reset}>Retry drive details</Button>
   <Link href="/hr/drives" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-primary-text">Back to Drives</Link>
  </div>
 </section>;
}
