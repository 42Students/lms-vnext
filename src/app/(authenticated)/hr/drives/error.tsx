"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <Alert tone="error" title="Drives could not load">
      <Button type="button" variant="secondary" onClick={reset}>Try again</Button>
    </Alert>
  );
}
