import { headers } from "next/headers";
import Link from "next/link";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";
import { getPublicPlacementStatistics } from "@/modules/placements/public-page/read-service";

/** Public route: never loads private placements, identities, or employer contacts.
 * A verified public publication producer and code delivery are still required
 * before displaying live numbers or accepting recruitment enquiries.
 */
export default async function PublicPlacementsPage() {
  const tenant = await resolveRequestTenant((await headers()).get("host"));
  const college = tenant.kind === "college"
    ? await getPublicCollegeBranding(tenant.collegeId)
    : null;
  const published = tenant.kind === "college" && college
    ? await getPublicPlacementStatistics(tenant.collegeId)
    : null;
  const metrics = publicPlacementDisclosure([
    { label: "Students placed", count: published?.placed ?? null },
    { label: "Offers received", count: published?.offers ?? null },
    { label: "Recruiting employers", count: published?.employers ?? null },
  ]);
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-primary-text">42Students · Placements</p>
        <h1 className="break-words text-3xl font-semibold text-foreground sm:text-4xl">
          {college?.collegeName ?? "College placements"}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-body">
          Placement results appear only if the college has explicitly enabled public reporting and each count meets the minimum disclosure threshold.
          Private student information is never displayed here.
        </p>
      </header>
      {published && metrics.some(metric=>!metric.suppressed) ? (
        <p className="mt-5 text-xs text-muted-foreground">
          College-published figures last updated{" "}
          <time dateTime={published.publishedAt}>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(published.publishedAt))}</time>.
          Individual records are never displayed here.
        </p>
      ) : null}
      <section aria-label="Placement results" className="mt-8 grid min-w-0 gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="min-w-0 rounded-xl border border-border bg-surface p-5">
            <h2 className="text-sm font-medium text-muted-foreground">{metric.label}</h2>
            <p className="mt-3 break-words text-lg font-semibold text-foreground">{metric.display}</p>
          </article>
        ))}
      </section>
      <section className="mt-8 rounded-xl border border-border bg-surface p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-foreground">Recruit from us</h2>
        <p className="mt-2 text-sm leading-6 text-body">
          Verified employer enquiries are not yet enabled for this college.
          We cannot accept your work email or send a verification code until that service is ready.
        </p>
      </section>
      <footer className="mt-8 text-sm"><Link href="/" className="text-primary-text underline">Back to college home</Link></footer>
    </main>
  );
}
