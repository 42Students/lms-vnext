"use client";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
export default function SuperAdminResourcesError({reset}:{error:Error & {digest?:string};reset:()=>void}) {
 return <div className="min-w-0 space-y-4"><PageHeader title="Resources" /><ErrorState title="Could not load resources" description="Learning resources for the selected college are temporarily unavailable." action={<Button className="min-h-11 w-full sm:min-h-9 sm:w-auto" onClick={reset}>Retry</Button>}/></div>;
}
