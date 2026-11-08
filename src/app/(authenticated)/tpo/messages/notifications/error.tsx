"use client";
import { ButtonLink } from "@/components/ui/button-link";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="min-w-0 space-y-4"><ErrorState
    title="Couldn't load my placement notifications"
    description="Delivery records could not be retrieved. A failure is not an empty inbox."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />
    <ButtonLink variant="secondary" href="/tpo/messages" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to messages</ButtonLink>
  </section>;
}
