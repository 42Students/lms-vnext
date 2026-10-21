"use client";
import {ErrorState} from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
import {Banner} from "@/components/ui/banner";
export default function InboundMailError({reset}:{reset:()=>void}){
 return <section className="min-w-0 space-y-[var(--lms-space-3)]" aria-label="Inbound mail load error">
  <Banner tone="warning" role="alert" action={<Button variant="secondary" type="button" onClick={reset} className="w-full md:w-auto">Retry</Button>}>
   Couldn't load inbound mail
  </Banner>
  <ErrorState title="Couldn't load inbound mail" description="Inbox data could not be read safely. The selected inbox view is unchanged."
   action={<Button variant="secondary" type="button" onClick={reset} className="w-full md:w-auto">Retry</Button>}/>
 </section>;
}
