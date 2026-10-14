"use client";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({ reset }: {error: Error & {digest?:string};reset:()=>void}) {
  return <ErrorState title="Applications unavailable" description="Could not load applicants. No empty or zero count is inferred."
    action={<button type="button" onClick={reset}>Retry</button>} />;
}
