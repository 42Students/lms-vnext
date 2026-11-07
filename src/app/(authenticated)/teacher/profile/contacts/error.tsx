"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section className="min-w-0 space-y-4">
  <PageHeader title="Unable to load contact details" />
  <p role="alert" className="max-w-prose text-sm leading-6 text-body">The read failed; this does not mean contact fields are empty.</p>
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
   <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto">Retry</Button>
   <ButtonLink variant="secondary" href="/teacher/profile" className="w-full sm:w-auto">Profile</ButtonLink>
  </div>
 </section>;
}
