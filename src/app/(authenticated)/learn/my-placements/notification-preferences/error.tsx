"use client";
import { PageHeader } from "@/components/ui/page-header";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";

export default function Error({reset}:{
  error:Error & {digest?:string};reset:()=>void;
}){
  return <section role="alert" className="min-w-0 space-y-4">
    <PageHeader title={"Could not load placement notification preferences"} />
    <p className="mt-2 text-sm text-body">The read failed. No saved-state assumption was made.</p>
    <div className="mt-4 flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
      <Button type="button" variant="secondary" onClick={reset}
        className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>
      <ButtonLink href="/learn/my-placements" variant="secondary"
        className="w-full sm:w-auto">My Placements</ButtonLink>
    </div>
  </section>;
}
