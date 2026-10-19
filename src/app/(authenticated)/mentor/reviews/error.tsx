"use client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
export default function Error({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <Alert tone="error">
    <h1 className="text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Unable to load delivery reviews</h1>
    <p className="mt-2 text-sm text-body">This failure is not evidence that your assigned projects have no records.</p>
    <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  </Alert>;
}
