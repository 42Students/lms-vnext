"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Contact record unavailable" description="The selected college contact could not be loaded."
    action={<><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink href="/college/contacts" variant="secondary">Back to contacts</ButtonLink></>}/>;
}
