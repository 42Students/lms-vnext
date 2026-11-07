"use client";
import { ErrorState } from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
import {ButtonLink} from "@/components/ui/button-link";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="Drives unavailable" description="The drives could not be loaded; this is not an empty-list conclusion."
    action={<div className="flex flex-col gap-2 sm:flex-row"><Button variant="secondary" type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button><ButtonLink variant="secondary" href="/college/placements" className="w-full sm:w-auto">Placement overview</ButtonLink></div>} />;
}
