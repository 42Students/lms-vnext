"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function SuperAdminVideosError({reset}:{error:Error & {digest?:string};reset:()=>void}) {
 return <ErrorState title="Could not load videos" description="The selected college content is temporarily unavailable." action={<Button onClick={reset}>Retry</Button>}/>;
}
