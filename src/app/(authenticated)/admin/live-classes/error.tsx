"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function SuperAdminLiveClassesError({reset}:{error:Error & {digest?:string};reset:()=>void}) {
 return <ErrorState title="Could not load live classes" description="Live class records for the selected college are temporarily unavailable." action={<Button onClick={reset}>Retry</Button>}/>;
}
