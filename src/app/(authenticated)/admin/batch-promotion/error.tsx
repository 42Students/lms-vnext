"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function AdminPromotionError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load promotion preview" description="The scoped batch preview is unavailable. No academic records were modified." action={<Button onClick={reset}>Retry</Button>} />;
}
