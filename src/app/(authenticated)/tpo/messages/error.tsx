"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="min-w-0 space-y-4"><PageHeader title="Messages"/><ErrorState
    title="Couldn't load messages"
    description="College-scoped communication records could not be retrieved. This error does not establish that the college has no recruiter conversations or notifications."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry messages</Button>}
  />
    <ButtonLink variant="secondary" href="/tpo/home" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to TPO home</ButtonLink>
  </section>;
}
