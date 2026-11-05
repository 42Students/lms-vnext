"use client";

import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MentorProjectTabs } from "@/components/projects/mentor-project-tabs";
import { ButtonLink } from "@/components/ui/button-link";

/** Keep the mentor's project tab and URL while retrying a failed panel.
 * A route exception is not permission to load another project's details.
 */
export default function MentorProjectError({ reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  const pathname=usePathname();
  const match=/^\/mentor\/projects\/([0-9a-f-]{36})(?:\/|$)/i.exec(pathname);
  const projectId=match?.[1]??null;
  return <section className="min-w-0 space-y-4">
    <Breadcrumbs items={[{label:"Projects",href:"/mentor/projects"},{label:"Project"}]}/>
    {projectId?<MentorProjectTabs projectId={projectId}/>:null}
    <ErrorState title="Couldn't load this project"
      description="Your project work has not been changed. Try again to reload the current tab."
      action={<div className="flex min-w-0 flex-wrap gap-3">
        <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Retry current tab</Button>
        <ButtonLink variant="secondary" href="/mentor/projects"
          className="w-full sm:w-auto">
          Back to projects
        </ButtonLink>
      </div>}/>
  </section>;
}
