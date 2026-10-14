"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}) {
 return <ErrorState title="Could not load directory" description="Selected-college read is unavailable. Your scope was not changed." action={<Button onClick={reset}>Retry</Button>}/>;
}