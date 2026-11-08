"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4"><PageHeader title="Placement eligibility"/><ErrorState title="Couldn't refresh batches" description="The latest batch data could not be loaded. No eligibility decisions were changed." action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/><ButtonLink variant="secondary" href="/tpo/home" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to TPO home</ButtonLink>
</div>}
