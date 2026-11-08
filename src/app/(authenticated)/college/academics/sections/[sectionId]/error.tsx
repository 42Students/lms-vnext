"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <ErrorState title="Academic section unavailable" description="The college section details could not be loaded."
    action={<div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>
      <TextLink href="/college/academics" className="inline-flex min-h-11 items-center">Back to Academics</TextLink>
    </div>}/>;
}
