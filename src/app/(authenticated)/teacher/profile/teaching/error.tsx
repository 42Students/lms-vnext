"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Unable to load Faculty teaching profile" />
  <p role="alert" className="max-w-prose text-sm leading-6 text-body">The read failed; an error is not evidence that no records exist.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
   <Button type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>
   <ButtonLink variant="secondary" href="/teacher/profile" className="w-full sm:w-auto">Profile overview</ButtonLink>
  </div>
 </section>;
}
