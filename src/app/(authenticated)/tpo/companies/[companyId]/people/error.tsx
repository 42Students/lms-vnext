"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4"><PageHeader title="Contact people"/><ErrorState title="Contact people could not be loaded" description="The contact list is unavailable; this is not an empty list." action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/><ButtonLink variant="secondary" href="/tpo/companies" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to companies</ButtonLink>
</div>}
