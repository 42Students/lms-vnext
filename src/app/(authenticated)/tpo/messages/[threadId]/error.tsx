"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { TextLink } from "@/components/ui/text-link";
export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Recruiter conversation" />
  <ErrorState title="Couldn't load this conversation" description="Messages could not be retrieved. No missing or empty conversation is inferred."
   action={<><Button type="button" variant="secondary" onClick={reset}>Retry</Button>
    <TextLink href="/tpo/messages" className="inline-flex min-h-11 items-center md:min-h-9">All conversations</TextLink></>}
  />
 </div>;
}
