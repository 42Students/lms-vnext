"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function SuperAdminResourcesError({reset}:{error:Error & {digest?:string};reset:()=>void}) {
 return <ErrorState title="Could not load resources" description="Learning resources for the selected college are temporarily unavailable." action={<Button onClick={reset}>Retry</Button>}/>;
}
