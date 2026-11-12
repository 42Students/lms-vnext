import type { RequestContext } from "@/modules/identity/context";
import { listMyCoordinatedOfferings } from "@/modules/courses/coordinator-service";
import { COORDINATOR_BADGE_HINT, COORDINATOR_BADGE_LABEL } from "@/modules/courses/coordinator-copy";
import { Heading } from "@/components/ui/heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { TextLink } from "@/components/ui/text-link";

/**
 * Shown on a teacher's course list only when they coordinate at least one course. Teachers who do not coordinate
 * anything see nothing new. A failed lookup also shows nothing: the rest of the page must not depend on it.
 */
export async function FacultyCoordinatedCourses({ context }: { context: RequestContext }) {
  const offerings = await listMyCoordinatedOfferings(context).catch(() => []);
  if (!offerings.length) return null;
  return (
    <section aria-label="Courses you coordinate" className="min-w-0 space-y-3 border-b border-border pb-5">
      <Heading level={2} size="lg" className="text-foreground">Courses you coordinate</Heading>
      <p className="text-sm text-body">{COORDINATOR_BADGE_HINT}</p>
      <ul className="divide-y divide-border border-y border-border">
        {offerings.map((item) => (
          <li key={item.offeringId} className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="break-words font-semibold text-foreground">{item.courseName}</p>
              <StatusBadge tone="info">{COORDINATOR_BADGE_LABEL}</StatusBadge>
            </div>
            <TextLink href={"/teacher/coordinate/" + encodeURIComponent(item.offeringId)}>
              Edit shared lessons
            </TextLink>
          </li>
        ))}
      </ul>
    </section>
  );
}
