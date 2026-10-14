"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function AdminProgressError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Could not load course progress" description="The scoped progress records are temporarily unavailable." action={<Button onClick={reset}>Retry</Button>} />;
}
