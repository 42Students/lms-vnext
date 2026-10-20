import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import { hasMembershipRole } from "@/modules/identity/context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { listArchivedTpoCompanyRelationships } from "@/modules/placements/tpo-company-lifecycle-service";

export default async function ArchivedCompanyRelationshipsPage() {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }
  await requireTpoBatchActor(context);
  const { rows, truncated } = await listArchivedTpoCompanyRelationships(context);
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <Link href="/tpo/companies" className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
      ← Companies directory
    </Link>
    <PageHeader  title="Archived company relationships"
      description="Relationships archived for your own college; these remain available for authorized restoration." />
    {truncated ? <p role="status" className="text-sm text-body">
      Showing only the first 100 archived relationships. This is not a complete list.
    </p> : null}
    {rows.length === 0 ? <EmptyState title="No archived college-company relationships are recorded." /> : <ul className="min-w-0 divide-y divide-border border-y border-border bg-surface">
      {rows.map((row) => <li key={row.companyId} className="flex flex-wrap items-center justify-between gap-3 py-4 text-sm">
        <span className="font-semibold text-foreground">{row.name}</span>
        <Link href={"/tpo/companies/" + encodeURIComponent(row.companyId) + "/manage"}
          className="lms-inline-link inline-flex min-h-11 items-center font-semibold text-link underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Review / restore →</Link>
      </li>)}
    </ul>}
  </div>;
}
