"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";

/** Do not log private provider exceptions or mistake a failed read for an
 * empty inbox. The retry keeps the current mentor notification filters. */
export default function MentorNotificationsError({
  reset,
}: {error:Error & {digest?:string};reset:()=>void}){
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader eyebrow="Mentor" title="Notifications"/>
    <ErrorState title="Notifications could not be loaded"
      description="Your notification history was not changed. Retry this view, or return to your assigned projects."
      action={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Button type="button" variant="secondary"
          className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry notifications</Button>
        <TextLink href="/mentor/projects"
          className="inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto md:min-h-9">My projects</TextLink>
      </div>}
    />
  </div>;
}
