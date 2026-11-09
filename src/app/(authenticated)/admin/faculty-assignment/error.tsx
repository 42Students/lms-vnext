"use client";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { ErrorState } from "@/components/ui/error-state";
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){
  return <section className="min-w-0">
    <ErrorState title="Could not load faculty assignments"
      description="The selected college teaching history could not be read. No assignment totals are inferred."
      action={<div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto">Retry</Button>
        <ButtonLink variant="secondary" href="/admin/academics" className="min-h-11 w-full sm:w-auto">Academic setup</ButtonLink>
      </div>}/>
  </section>;
}
