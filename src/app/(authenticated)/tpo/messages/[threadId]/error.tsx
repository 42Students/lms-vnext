"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Recruiter conversation" />
  <ErrorState title="Couldn't load this conversation" description="Messages could not be retrieved. No missing or empty conversation is inferred."
   action={<div className="flex min-w-0 flex-wrap gap-2"><Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry conversation</Button>
    <TextLink href="/tpo/messages" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">All conversations</TextLink></div>}
  />
 </div>;
}
