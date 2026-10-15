import { headers } from "next/headers";
import Link from "next/link";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";

/** Public route: never loads private placements, identities, or employer contacts.
 * A verified public publication producer and code delivery are still required
 * before displaying live numbers or accepting recruitment enquiries.
 */
export default async function PublicPlacementsPage() {
  const tenant = await resolveRequestTenant((await headers()).get("host"));
  const college = tenant.kind === "college"
    ? await getPublicCollegeBranding(tenant.collegeId)
    : null;
  const metrics = publicPlacementDisclosure([
    { label: "Students placed", count: null },
    { label: "Offers received", count: null },
    { label: "Recruiting employers", count: null },
  ]);
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-8">
      <header className="space-y-3">
        <p className="text-sm font-semibold text-primary-text">42Students · Placements</p>
        <h1 className="break-words text-3xl font-semibold text-foreground sm:text-4xl">
          {college?.collegeName ?? "College placements"}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-body">
          Placement results will appear when the college has enabled verified public reporting.
          Private student information is never displayed here.
        </p>
      </header>
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
