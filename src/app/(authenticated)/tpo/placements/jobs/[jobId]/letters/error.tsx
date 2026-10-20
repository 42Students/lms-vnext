"use client";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <Alert tone="error">
    <p>Offer evidence cannot be loaded. It is not assumed to be empty.</p>
    <Button variant="secondary" type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry</Button>
  </Alert>;
}
