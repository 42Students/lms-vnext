"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <ErrorState title="Could not prepare a drive draft"
    description="No request was saved or submitted. Check your access and try again."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/>;
}
