"use client";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Alert tone="error">
    <p>The close-out counts could not be loaded, so none are inferred.</p>
    <Button variant="secondary" type="button" onClick={reset}>Retry</Button>
  </Alert>;
}
