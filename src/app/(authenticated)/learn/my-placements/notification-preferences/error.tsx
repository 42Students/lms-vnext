"use client";

import { Button } from "@/components/ui/button";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}){
  return <section role="alert" className="border-b border-border bg-transparent py-6">
    <h1 className="font-semibold text-[var(--lms-heading)] text-[30px] leading-9">Could not load placement notification preferences</h1>
    <p className="mt-2 text-sm text-body">The read failed. No saved-state assumption was made.</p>
    <Button type="button" variant="secondary" onClick={reset}
      className="mt-4 min-h-11">Retry</Button>
  </section>;
}
