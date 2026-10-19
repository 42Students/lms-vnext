"use client";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Alert tone="error">
    <p>Candidate round schedules could not be loaded; this is not an empty schedule.</p>
    <Button variant="secondary" type="button" onClick={reset}>Retry</Button>
  </Alert>;
}
