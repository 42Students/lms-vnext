import { PageHeader } from "@/components/ui/page-header";
import { TextLink } from "@/components/ui/text-link";

/** An invalid URL filter is a navigation error, never a permission fallback.
 * Keep the selected project ID and let the server enforce project access on
 * the clean destination (no cross-project lookup or guessed membership).
 */
export function MentorProjectFilterError({projectId,kind}:{
  projectId:string;
  kind:"board"|"activity";
}){
  const base="/mentor/projects/"+encodeURIComponent(projectId);
  const destination=base+(kind==="board"?"/board-review":"/activity-history");
  return <section role="alert" className="min-w-0 max-w-full space-y-3">
    <PageHeader title={kind==="board"?"Invalid board filters":"Invalid activity filters"}
      description="The filter link was invalid. Your project information has not been changed." />
    <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
      <TextLink href={destination}
        className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">
        Clear filters and retry
      </TextLink>
      <TextLink href={base}
        className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">
        Back to this project
      </TextLink>
    </div>
  </section>;
}
