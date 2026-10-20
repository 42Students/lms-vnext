"use client";
import { ErrorState } from "@/components/ui/error-state";
import { Button } from "@/components/ui/button";
import { PageBackLink } from "@/components/ui/page-back-link";
export default function RouteError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-4">
    <PageBackLink href="/college/faculty" label="Back to Faculty" />
    <ErrorState title="Faculty importer unavailable"
    description="The importer could not load. No faculty membership was changed by this error screen."
    action={<Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry</Button>}/>
  </div>;
}
