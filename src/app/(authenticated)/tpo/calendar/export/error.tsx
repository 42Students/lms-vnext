"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4"><PageHeader title="Export upcoming placement rounds"/><ErrorState title="Couldn't load upcoming round export" description="No empty calendar or export is inferred after a failed read." action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/></div>}
