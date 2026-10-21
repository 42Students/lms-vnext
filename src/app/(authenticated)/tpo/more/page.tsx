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
    <div data-testid="tpo.more" className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="TPO · Navigation"
        title="More"
        description="Secondary placement tools, insights and account controls that stay out of your main day-to-day navigation."
      />

      <nav
        aria-label="More TPO destinations"
        className="grid gap-4 border-b border-border pb-4 min-[900px]:grid-cols-[1.2fr_0.8fr]"
      >
        {TPO_MORE_GROUPS.map((group) => (
          <section
            key={group.heading}
            aria-label={group.heading}
            className={"min-w-0 space-y-3 border border-border p-4 "+(group.heading==="Work"?"min-[900px]:row-span-2":"")}
          >
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground">
                {group.heading}
              </h2>
              <p className="mt-1 text-sm text-body">
                {group.description}
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-1 border-t border-border">
              {group.links.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group block min-h-16 min-w-0 border-b border-border px-3 py-3 transition-colors hover:bg-[rgba(38,186,199,0.07)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9"
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

    </div>
  );
}
