"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4"><PageHeader title="Internal feedback"/><ErrorState title="Couldn't load Companies · Feedback" description="The requested records could not be retrieved. A load failure does not mean there are no records or that a reported total is zero." action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/></div>}
