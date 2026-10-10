import Link from "next/link";
import {
  COLLEGE_ADMIN_QUICK_ACTIONS,
  COLLEGE_ADMIN_SETUP_PHASES,
  SUPER_ADMIN_GLOBAL_LINKS,
} from "@/modules/admin-ui/admin-dashboard-navigation";

function ActionLink({
  label,
  href,
  subtitle,
}: {
  label: string;
  href: string | null;
  subtitle?: string;
}) {
  if (!href) {
    return (
      <div
        aria-disabled="true"
        className="rounded-lg border border-border bg-muted p-4"
      >
        <p className="m-0 text-sm font-semibold text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {subtitle ?? "This workflow is not yet available in vNext."}
        </p>
      </div>
    );
  }
  return (
    <Link
      href={href}
      className="block rounded-lg border border-border bg-surface p-4 transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
    >
      <p className="m-0 text-sm font-semibold text-foreground">{label}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {subtitle ?? "Open this workspace"}
      </p>
    </Link>
  );
}

export function CollegeAdminDashboardActions() {
  return (
    <div className="space-y-6">
      <section aria-label="Quick Actions" className="space-y-3">
        <h2 className="m-0 text-lg font-semibold text-foreground">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COLLEGE_ADMIN_QUICK_ACTIONS.map((item) => (
            <ActionLink key={item.key} label={item.label} href={item.href} />
          ))}
        </div>
      </section>
      <section aria-label="Setup Guide" className="space-y-4">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Setup Guide (Follow in Order)
          </h2>
          <p className="mt-1 text-sm text-body">
            Start with academic structure, then add courses and people.
            Unavailable stages are shown explicitly until their full workflows are ported.
          </p>
        </div>
        {COLLEGE_ADMIN_SETUP_PHASES.map((phase, phaseIndex) => (
          <section
            key={phase.title}
            className="space-y-3 rounded-xl border border-border bg-surface p-5"
            aria-label={phase.title}
          >
            <h3 className="m-0 text-base font-semibold text-foreground">
              {phaseIndex + 1}. {phase.title}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {phase.steps.map((step) => (
                <ActionLink
                  key={step.key}
                  label={step.label}
                  href={step.href}
                  subtitle={step.href ? "Open setup workflow" : undefined}
                />
              ))}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}

/** Keep this separate: the legacy Super Admin dashboard had no setup guide. */
export function SuperAdminGlobalDashboardActions() {
  return (
    <section aria-label="Platform quick links" className="space-y-3">
      <h2 className="m-0 text-lg font-semibold text-foreground">
        Platform quick links
      </h2>
      <p className="text-sm text-body">
        Select a college in the top bar for detailed metrics,
        or use a supported platform-wide workspace.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        {SUPER_ADMIN_GLOBAL_LINKS.map((item) => (
          <ActionLink key={item.label} label={item.label} href={item.href} />
        ))}
      </div>
    </section>
  );
}
