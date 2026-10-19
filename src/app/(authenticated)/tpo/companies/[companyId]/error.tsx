"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="\n        Couldn't load company detail\n      "
    description="Company contacts, drives and hiring history could\n        not be retrieved. The failure is not represented\n        as an empty company record."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}
  />;
}
