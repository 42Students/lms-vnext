"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="College branding unavailable" description="The college branding details could not be loaded. No branding values were changed."
    action={<><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink href="/college" variant="secondary">College home</ButtonLink></>}/>;
}
