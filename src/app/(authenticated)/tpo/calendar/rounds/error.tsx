"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4"><PageHeader title="Drive round scheduling"/><ErrorState title="Round scheduling could not load" description="The schedule is unavailable, not empty." action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/><ButtonLink variant="secondary" href="/tpo/calendar" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to calendar</ButtonLink>
</div>}
