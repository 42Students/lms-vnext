"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div role="alert" className="space-y-3">
    <h2 className="font-semibold text-foreground">Could not prepare a drive draft</h2>
    <p className="text-sm text-body">No request was saved or submitted. Check your access and try again.</p>
    <Button type="button" variant="secondary" onClick={reset}>Retry</Button>
  </div>;
}
