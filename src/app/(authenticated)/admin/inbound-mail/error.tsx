"use client";
import {ErrorState} from "@/components/ui/error-state";
import {Button} from "@/components/ui/button";
export default function InboundMailError({reset}:{reset:()=>void}){
 return <ErrorState title="Inbound mail unavailable" description="Inbox data could not be read safely. Retry or contact the administrator."
 action={<Button variant="secondary" type="button" onClick={reset}  className="w-full md:w-auto">Retry</Button>}/>;
}
