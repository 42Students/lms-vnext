"use client";
import { ButtonLink } from "@/components/ui/button-link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function ProjectSectionError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Project workspace" />
    <ErrorState title="Workspace could not be loaded"
      description="The workspace summary could not be loaded. Check your connection and retry. If it is no longer available, return to the projects list."
      action={<><Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" onClick={reset}>Retry workspace</Button><ButtonLink href="/college/projects" className="w-full sm:w-auto" variant="secondary">All projects</ButtonLink></>} />
  </div>;
}
