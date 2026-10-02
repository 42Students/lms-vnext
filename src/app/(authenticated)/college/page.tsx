import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { listColleges } from "@/modules/colleges/service";

export default async function CollegeOverviewPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const colleges = await listColleges(
    context,
    membership.organizationId,
  );
  const college = colleges[0];

  if (!college) {
    return (
      <EmptyState
        title="College unavailable"
        description="Your active membership no longer resolves to an active college."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title={college.name}
        description="Your college profile is loaded through the tenant-scoped college service."
        actions={
          <>
            <StatusBadge tone="success">Active</StatusBadge>
            <CollegeEditDialog
              college={college}
              triggerLabel="Edit college"
            />
          </>
        }
      />
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Code
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.code}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            City
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.city || "—"}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            State
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.state || "—"}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Country
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {college.country || "—"}
          </p>
        </div>
      </section>
    </div>
  );
}
