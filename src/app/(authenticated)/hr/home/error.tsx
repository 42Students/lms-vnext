"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error;reset:()=>void}){return <div className="min-w-0 max-w-2xl space-y-4"><PageHeader title="Today" /><ErrorState title="We couldn't load your account"
  description="Your drive information has not been changed. Check your connection and try again."
  action={<Button type="button" onClick={reset}>Retry</Button>}/></div>;}
