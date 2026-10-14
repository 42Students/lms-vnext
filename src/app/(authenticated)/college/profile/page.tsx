import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { getOwnAccountSummary } from "@/modules/people/own-account-service";

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function Field({ title, value }: { title: string; value: string | null }) {
  return (
    <div>
      <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {value || "—"}
      </p>
    </div>
  );
}

export default async function CollegeAdminProfilePage() {
  const context = await getCurrentRequestContext();
  // The layout also redirects, but layouts and pages render in parallel, so
  // the page enforces the role itself.
  if (!hasMembershipRole(context, "COLLEGE_ADMIN")) redirect("/dashboard");

  const account = await getOwnAccountSummary(context);
  if (!account) {
    return (
      <EmptyState
        title="Profile unavailable"
        description="Your account could not be loaded. Sign out and sign in again."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="My profile"
        description="The account you sign in with. Contact details are changed by your platform administrator."
        actions={
          <Link
            href="/account/security"
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
          >
            Signed-in devices
          </Link>
        }
      />

      <section className="grid gap-5 rounded-xl border border-border bg-surface p-6 sm:grid-cols-2">
        <Field title="Name" value={account.displayName} />
        <Field title="Mobile" value={account.phoneE164} />
        <Field title="Email" value={account.email} />
        <Field title="College" value={account.college?.name ?? null} />
        <Field
          title="Organization"
          value={account.college?.organizationName ?? null}
        />
        <Field title="College code" value={account.college?.code ?? null} />
        <div className="sm:col-span-2">
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Roles in this college
          </p>
          <p className="mt-2 flex flex-wrap gap-2">
            {account.roles.length === 0 ? (
              "—"
            ) : (
              account.roles.map((role) => (
                <StatusBadge key={role} tone="info">
                  {roleLabel(role)}
                </StatusBadge>
              ))
            )}
            {account.isSuperAdmin ? (
              <StatusBadge tone="warning">Super Admin</StatusBadge>
            ) : null}
          </p>
        </div>
      </section>
      <Link href="/college/college-profile"
        className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text hover:underline">
        Edit college display and support contacts
      </Link>
    </div>
  );
}
