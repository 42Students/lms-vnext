"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState
    title="Couldn't load Placements"
    description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero."
    action={<>
      <Button type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>
      <Link href="/tpo/placements/lifecycle" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text sm:w-auto md:min-h-9">Drive lifecycle</Link>
    </>}
  />;
}
