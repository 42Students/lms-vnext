"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

export default function ProjectSectionError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Project workspace" />
    <ErrorState title="Workspace could not be loaded"
      description="The workspace summary could not be loaded. Check your connection and retry. If it is no longer available, return to the projects list."
      action={<Button variant="secondary" onClick={reset}>Retry workspace</Button>} />
  </div>;
}
