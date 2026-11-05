"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";
export default function TpoHomeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Home" />
  <ErrorState title="Could not load Home" description="Something went wrong while loading this content. Your current context has been kept."
   action={<><Button variant="secondary" type="button" onClick={reset}>Retry</Button>
    <TextLink href="/tpo/placements" className="inline-flex min-h-11 items-center md:min-h-9">Placements</TextLink></>}/>
 </div>;
}
