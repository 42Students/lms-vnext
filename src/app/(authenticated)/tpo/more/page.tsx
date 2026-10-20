import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { TPO_MORE_GROUPS } from "@/modules/placements/tpo-utility-model";

export default async function TpoMorePage() {
  const context =
    await getCurrentRequestContext();

  if (!hasMembershipRole(context, "TPO")) {
    redirect("/dashboard");
  }

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="TPO · Navigation"
        title="More"
        description="Quick access to the placement tools, recruiter relationships and account pages available to your TPO membership."
      />

      <nav
        aria-label="More TPO destinations"
        className="space-y-6 border-b border-border pb-4"
      >
        {TPO_MORE_GROUPS.map((group) => (
          <section
            key={group.heading}
            aria-label={group.heading}
            className="min-w-0 space-y-3"
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {group.heading}
              </h2>
              <p className="mt-1 text-sm text-body">
                {group.description}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 border-t border-border min-[768px]:grid-cols-2 min-[768px]:gap-x-6">
              {group.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block min-h-11 min-w-0 border-b border-border py-4 transition-colors hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <h3 className="min-w-0 break-words text-base font-semibold text-link">
                      {item.label}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-link transition motion-reduce:transition-none group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                    >
                      →
                    </span>
                  </div>
                  <p className="mt-2 max-w-prose break-words text-sm leading-6 text-body">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <details className="min-w-0 text-xs leading-5 text-muted-foreground">
        <summary className="min-h-11 cursor-pointer py-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary min-[768px]:min-h-9">Only implemented TPO destinations are linked.</summary>
        <p className="mt-2 max-w-prose">This navigation links to the implemented scoped tools; complete
          legacy Messages and Settings parity remains open.</p>
      </details>
    </div>
  );
}
