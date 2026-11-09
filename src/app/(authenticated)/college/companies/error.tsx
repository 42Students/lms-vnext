"use client";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-4"><PageHeader title="Companies"/><ErrorState title="College companies unavailable" description="The college company records could not be loaded."
    action={<><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button><ButtonLink href="/college" variant="secondary">College home</ButtonLink></>}/></div>;
}
