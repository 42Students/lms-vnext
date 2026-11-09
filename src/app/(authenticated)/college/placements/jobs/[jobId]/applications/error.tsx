"use client";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
export default function ErrorPage({ reset }: {error: Error & {digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-4"><PageHeader title="Placement applications"/><ErrorState title="Applications unavailable" description="Could not load applicants. No empty or zero count is inferred."
    action={<><Button variant="secondary" type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button><ButtonLink href="/college/placements" variant="secondary">Placements</ButtonLink></>} /></div>;
}
