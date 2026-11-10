"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
export default function RouteError({reset}:{error:Error & {digest?:string};reset:()=>void}){
 return <div className="min-w-0 space-y-4"><PageHeader title="Batch workspace"/><ErrorState title="Couldn't load this batch" description="The batch workspace could not be retrieved. A loading failure does not mean that the batch has no registrations or classes." action={<Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry batch</Button>}/><ButtonLink variant="secondary" href="/tpo/batches" className="inline-flex min-h-11 w-full items-center justify-center sm:w-auto md:min-h-9">Back to batches</ButtonLink>
</div>;
}
