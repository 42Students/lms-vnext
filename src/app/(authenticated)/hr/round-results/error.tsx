"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
export default function Error({reset}:{error:Error;reset:()=>void}){
 return <ErrorState title="Round results could not load"
   description="Round results could not load."
   action={<Button type="button" variant="secondary" onClick={reset}>Try again</Button>}/>;
}
