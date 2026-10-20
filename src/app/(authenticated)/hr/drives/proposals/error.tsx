"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";

export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 max-w-full"><ErrorState title="Proposal history unavailable"
    description="This does not mean previous messages were lost."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>}/></div>;
}
