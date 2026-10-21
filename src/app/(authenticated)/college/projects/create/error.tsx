"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";

/** A template fetch failure is not the same as having no published assignments. */
export default function CreateWorkspaceError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-4">
    <PageHeader title="Create workspace" description="Choose a published assigned template." />
    <ErrorState title="Could not load assigned project templates"
      description="The available templates could not be loaded. This does not mean the college has no assigned templates. Retry the request."
      action={<Button type="button" variant="secondary" onClick={reset}>Retry loading templates</Button>} />
  </div>;
}
