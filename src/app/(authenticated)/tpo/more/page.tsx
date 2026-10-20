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
    <div className="min-w-0 space-y-5"
      <PageHeader
        
        title="More"
        description="Quick access to the placement tools, recruiter relationships and account pages available to your TPO membership."
      />

      <nav
        aria-label="More TPO destinations"
        className="space-y-6"
      >
        {TPO_MORE_GROUPS.map((group) => (
          <section
            key={group.heading}
            aria-label={group.heading}
            className="space-y-3"
          >
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {group.heading}
              </h2>
              <p className="mt-1 text-sm text-body">
                {group.description}
              </p>
            </div>

            <div className="divide-y divide-border border-y border-border">
              {group.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block min-w-0 px-3 py-4 transition-colors hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-link">
                      {item.label}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="text-link transition group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-body">
                    {item.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </nav>

      <p className="text-xs leading-5 text-muted-foreground">
        Only implemented TPO destinations are linked.
        This navigation links to the implemented scoped tools; complete
        legacy Messages and Settings parity remains open.
      </p>
    </div>
  );
}
