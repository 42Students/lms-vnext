import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { requireTpoBatchActor } from "@/modules/placements/tpo-batch-workspace-read-service";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listArchivedTpoCompanyRelationships } from "@/modules/placements/tpo-company-lifecycle-service";
import { TextLink } from "@/components/ui/text-link";

import { ROLE } from "@/modules/identity/roles";
const directoryLinkClasses =
  "lms-inline-link inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link underline hover:underline focus-ring md:min-h-9";

export default async function ArchivedCompanyRelationshipsPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) {
    redirect("/dashboard");
  }
  await requireTpoBatchActor(context);
  const { rows, truncated } = await listArchivedTpoCompanyRelationships(context);
  return (
    <div className="min-w-0 space-y-4 md:space-y-6">
      <PageHeader title="Archived company relationships"
        description="Relationships archived for your own college; these remain available for authorized restoration."
        actions={<TextLink variant="bare" href="/tpo/companies?directory=1" className={directoryLinkClasses}>← Companies directory</TextLink>}
      />
      {truncated ? (
        <p role="status" className="min-w-0 border-l-2 border-warning bg-warning-subtle px-4 py-3 text-sm leading-[1.6] text-body">
          Showing only the first 100 archived relationships. This is not a complete list.
        </p>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="No archived college-company relationships are recorded."
          action={<TextLink variant="bare" href="/tpo/companies?directory=1" className={directoryLinkClasses}>← Companies directory</TextLink>} />
      ) : (
        <section aria-label="Archived company relationships" className="min-w-0">
          <p className="mb-2 text-sm leading-[22px] text-body">
            {rows.length} archived {rows.length === 1 ? "relationship" : "relationships"} in this view
          </p>
          <ul className="min-w-0 divide-y divide-border border-y border-border bg-surface">
            {rows.map((row) => (
              <li key={row.companyId} className="flex min-w-0 flex-col items-start gap-2 py-4 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <span className="min-w-0 max-w-full break-words font-semibold leading-6 text-foreground">{row.name}</span>
                <TextLink href={"/tpo/companies/" + encodeURIComponent(row.companyId) + "/manage"}
                  className="inline-flex min-h-11 max-w-full shrink-0 items-center md:min-h-9">
                  Review / restore →
                </TextLink>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
