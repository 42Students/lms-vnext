"use client";

import { TextLink } from "@/components/ui/text-link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 max-w-full"><ErrorState title="Proposal history unavailable"
    description="This does not mean previous messages were lost."
    action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><TextLink href="/hr/drives" className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">Back to drives</TextLink></span>}/></div>;
}
