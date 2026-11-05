"use client";

import {Button} from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";

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
  <PageHeader title="Application status unavailable" />
  <p className="mt-2 text-sm text-body">We couldn't load this drive or confirm your application status.
   Please check status again before applying. Do not submit a second application until it is confirmed.</p>
  <div className="mt-4 flex flex-wrap items-center gap-3">
   <Button type="button" onClick={reset}>Check status again</Button>
   <TextLink href="/learn/my-placements/jobs" className="text-sm">Browse drives</TextLink>
   <TextLink href="/learn/my-placements/applications" className="text-sm">My applications</TextLink>
  </div>
 </section>;
}
