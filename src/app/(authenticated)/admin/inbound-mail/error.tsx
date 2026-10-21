"use client";
import {Button} from "@/components/ui/button";
import {Banner} from "@/components/ui/banner";
/** Retain the scoped inbox context on a failed read; never present the
 * absence of rows as an empty inbox when the request actually failed. */
export default function InboundMailError({reset}:{reset:()=>void}){
 return <section className="min-w-0 space-y-[var(--lms-space-3)]" aria-label="Inbound mail load error">
  <Banner tone="warning" role="alert"
   action={<Button variant="secondary" type="button" onClick={reset}
    className="w-full md:w-auto">Retry</Button>}>
   Couldn't load inbound mail
  </Banner>
  <p className="max-w-prose text-sm text-body">
   The inbox could not be loaded. Your current inbox selection was not changed.
   Retry the authorized inbox request; this warning does not mean the inbox is empty.
  </p>
 </section>;
}
