"use client";
import { TextLink } from "@/components/ui/text-link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
export default function Error({reset}:{error:Error;reset:()=>void}){return <div className="min-w-0 max-w-2xl space-y-4"><PageHeader title="Today" /><ErrorState title="We couldn't load your account"
  description="Your drive information has not been changed. Check your connection and try again."
  action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button variant="secondary" type="button" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><TextLink href="/dashboard" className="inline-flex min-h-11 items-center justify-center px-3 text-sm md:min-h-9">Choose workspace</TextLink></span>}/></div>;}
