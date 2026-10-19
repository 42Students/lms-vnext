"use client";
import { Button } from "@/components/ui/button";
export default function ErrorView({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return <section role="alert" className="border-b border-border bg-transparent py-6">
    <h1 className="font-semibold">Couldn&apos;t load shortlist sharing preview</h1>
    <p className="mt-2 text-sm text-body">
      Failed records are not interpreted as an empty shortlist. Please retry.
    </p>
    <Button className="mt-3" onClick={reset}>Retry</Button>
  </section>;
}