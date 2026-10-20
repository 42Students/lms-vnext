"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function Error({reset}:{error:Error;reset:()=>void}){return <ErrorState title="We couldn\'t load your account"
  description="Your drive information has not been changed. Check your connection and try again."
  action={<Button type="button" onClick={reset}>Retry</Button>}/>;}
