"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}){
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={"Could not load placement notification preferences"} />
    <p className="mt-2 text-sm text-body">The read failed. No saved-state assumption was made.</p>
    <Button type="button" variant="secondary" onClick={reset}
      className="mt-4 min-h-11">Retry</Button>
  </section>;
}
