"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4"><PageHeader title="Placement eligibility"/><ErrorState title="Couldn't refresh batches" description="The latest batch data could not be loaded. No eligibility decisions were changed." action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/></div>}
