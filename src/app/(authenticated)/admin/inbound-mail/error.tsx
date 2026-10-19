"use client";
import {ErrorState} from "@/components/ui/error-state";
export default function InboundMailError({reset}:{reset:()=>void}){
 return <ErrorState title="Inbound mail unavailable" description="Inbox data could not be read safely. Retry or contact the administrator."
 action={<button type="button" onClick={reset} className="min-h-10 rounded-md border border-border px-4">Retry</button>}/>;
}
