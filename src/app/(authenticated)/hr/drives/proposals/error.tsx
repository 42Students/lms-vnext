"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function ErrorView({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <Alert tone="error" title="Proposal history unavailable">
    <p>This does not mean previous messages were lost.</p>
    <div className="mt-2 flex flex-wrap gap-2"><Button type="button" variant="secondary" onClick={reset}>Retry</Button></div>
  </Alert>;
}
