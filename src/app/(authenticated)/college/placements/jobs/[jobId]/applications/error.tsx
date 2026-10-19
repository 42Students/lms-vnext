"use client";
import { ErrorState } from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
export default function ErrorPage({ reset }: {error: Error & {digest?:string};reset:()=>void}) {
  return <ErrorState title="Applications unavailable" description="Could not load applicants. No empty or zero count is inferred."
    action={<Button variant="ghost" type="button" onClick={reset}>Retry</Button>} />;
}
