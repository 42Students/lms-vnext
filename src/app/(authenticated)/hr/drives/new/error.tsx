"use client";
import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div role="alert" className="space-y-3 rounded-xl border border-border bg-surface p-6">
    <h2 className="font-semibold text-foreground">Could not prepare a drive draft</h2>
    <p className="text-sm text-body">No request was saved or submitted. Check your access and try again.</p>
    <button type="button" onClick={reset} className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">Retry</button>
  </div>;
}
