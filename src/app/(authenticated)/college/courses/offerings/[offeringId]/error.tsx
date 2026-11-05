"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function CollegeOfferingError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Course details could not be loaded" role="alert"
    description="This is a loading problem, not a missing course. Check your connection and try again."
    action={<div className="flex min-w-0 flex-wrap gap-3">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>
      <TextLink href="/college/courses" className="inline-flex min-h-11 items-center md:min-h-9">Back to Courses</TextLink>
    </div>}/>;
}
