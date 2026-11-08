"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 max-w-full"><ErrorState title="Programs directory unavailable" description="The program directory could not be loaded. No college data was changed."
    action={<div className="flex flex-col gap-2 sm:flex-row">
      <Button type="button" variant="secondary" onClick={reset} className="min-h-11 w-full md:w-auto">Retry</Button>
      <ButtonLink variant="secondary" href="/college/programs" className="w-full sm:w-auto">Open programs</ButtonLink>
    </div>}/></div>;
}
