"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { MentorProjectTabs } from "@/components/projects/mentor-project-tabs";

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
        <Link href="/mentor/projects"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-link focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9 lms-inline-link hover:underline">
          Back to projects
        </Link>
      </div>}/>
  </section>;
}
