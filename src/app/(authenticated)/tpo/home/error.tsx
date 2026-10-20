"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function TpoHomeError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Home" />
  <ErrorState title="Could not load Home" description="Something went wrong while loading this content. Your current context has been kept."
   action={<><Button variant="secondary" type="button" onClick={reset}>Retry</Button>
    <Link href="/tpo/placements" className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">Placements</Link></>}/>
 </div>;
}
