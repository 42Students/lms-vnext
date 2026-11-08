"use client";
import { ButtonLink } from "@/components/ui/button-link";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="min-w-0 space-y-4"><Alert tone="error">
    <p>Candidate round schedules could not be loaded; this is not an empty schedule.</p>
    <Button variant="secondary" type="button" onClick={reset}>Retry</Button>
  </Alert>
  <ButtonLink variant="secondary" href="/tpo/placements" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to placements</ButtonLink>
  </section>;
}
