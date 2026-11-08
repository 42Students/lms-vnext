import { redirect } from "next/navigation";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { learnerAssignmentsLegacyAliasHref } from "@/modules/courses/learner-assignment-page-model";

/** Old assignment bookmarks must retain authorized course and page filters.
 * No owner, college or arbitrary query selector is forwarded. */
export default async function LearnerAssignmentsAliasPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string | string[]; page?: string | string[] }>;
}) {
  const target = learnerAssignmentsLegacyAliasHref(await searchParams);
  if (target) redirect(target);
  return <section className="min-w-0 space-y-4">
    <PageHeader title="Assignments" />
    <ErrorState title="Check your assignment link"
      description="The course or page filter in this bookmark is invalid or repeated. Open the assignment list to choose an available course."
      retryHref="/learn/allAssignments" retryLabel="View all assignments" />
  </section>;
}
