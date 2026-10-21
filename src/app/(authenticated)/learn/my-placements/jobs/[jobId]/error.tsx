"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";

/** Route-local fail-closed recovery: unknown application status must never
 * be presented as an unsubmitted application or an enabled Apply action.
 */
export default function LearnerJobDetailError({
 reset,
}:{
 error:Error&{digest?:string};
 reset:()=>void;
}){
 return <section role="alert" className="mx-auto max-w-2xl rounded-[var(--lms-control-radius)] border border-border bg-surface p-5">
  <h1 className="text-lg font-semibold text-foreground">Application status unavailable</h1>
  <p className="mt-2 text-sm text-body">We couldn't load this drive or confirm your application status.
   Please check status again before applying. Do not submit a second application until it is confirmed.</p>
  <div className="mt-4 flex flex-wrap items-center gap-3">
   <Button type="button" onClick={reset}>Check status again</Button>
   <Link href="/learn/my-placements/jobs" className="text-sm font-semibold text-primary-text underline">Browse drives</Link>
   <Link href="/learn/my-placements/applications" className="text-sm font-semibold text-primary-text underline">My applications</Link>
  </div>
 </section>;
}
