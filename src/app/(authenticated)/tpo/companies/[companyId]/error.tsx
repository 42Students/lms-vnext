"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){return <div className="min-w-0 space-y-4"><PageHeader title="Company detail"/><ErrorState title="Couldn't load company detail" description="Company contacts, drives and hiring history could not be retrieved. The failure is not represented as an empty company record." action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/></div>}
