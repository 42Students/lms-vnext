import { headers } from "next/headers";
import {notFound} from "next/navigation";
import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";
import { getPublicPlacementStatistics } from "@/modules/placements/public-page/read-service";
import { readOptionalPublicPlacementData } from "@/modules/placements/public-page/optional-read-model";
import { publicPageAvailabilityMessage } from "@/modules/placements/public-page/public-page-availability-model";

/** Public route: never loads private placements, identities, or employer contacts.
 * A verified public publication producer and code delivery are still required
 * before displaying live numbers or accepting recruitment enquiries.
 */
export default async function PublicPlacementsPage() {
  const tenant = await resolveRequestTenant((await headers()).get("host"));
  const brandRead=tenant.kind==="college"
    ? await readOptionalPublicPlacementData(()=>getPublicCollegeBranding(tenant.collegeId))
    : null;
  const college=brandRead?.available?brandRead.value:null;
  const publicRead = tenant.kind === "college" && college
    ? await readOptionalPublicPlacementData(()=>getPublicPlacementStatistics(tenant.collegeId))
    : null;
  const published = publicRead?.available ? publicRead.value : null;
  // An unknown host or an explicitly unpublished college page must be a 404.
  // An unavailable database is not evidence that the college unpublished it.
  if(tenant.kind!=="college"||(brandRead?.available&&!college)||
   (publicRead?.available&&!published))notFound();
  const metrics = publicPlacementDisclosure([
    { label: "Students placed", count: published?.placed ?? null },
    { label: "Offers received", count: published?.offers ?? null },
    { label: "Recruiting employers", count: published?.employers ?? null },
  ]);
  const money = (value: number | null | undefined) => value == null
    ? "Not enough data yet" : new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(value);
  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-10 sm:px-8">
      <header className="space-y-3">
        <h1 className="break-words text-3xl font-semibold text-foreground sm:text-4xl">
          {"Placements at "+(college?.collegeName??"your college")}
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-body">
          Recruit from us. See the placements this college has chosen to share.
        </p>
      </header>
      {published && metrics.some(metric=>!metric.suppressed) ? (
        <p className="mt-5 text-xs text-muted-foreground">
          College-published figures last updated{" "}
          <time dateTime={published.publishedAt}>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(published.publishedAt))}</time>.
          Individual records are never displayed here.
        </p>
      ) : null}
      {brandRead && !brandRead.available ? (
        <p role="status" className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-body">
          {publicPageAvailabilityMessage("branding")}
        </p>
      ) : null}
      {publicRead && !publicRead.available ? (
        <p role="status" className="mt-6 rounded-lg border border-border bg-surface p-4 text-sm text-body">
          Public placement statistics are temporarily unavailable. No individual student information is shown.
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
      {published && (published.medianCtcInr !== null || published.highestCtcInr !== null)
        ? <section aria-label="Package summary" className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
          {([["Median", published.medianCtcInr], ["Highest package", published.highestCtcInr]] as const)
            .map(([label, value]) => <article key={label} className="rounded-xl border border-border bg-surface p-5">
              <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
              <p className="mt-2 text-lg font-semibold text-foreground">{money(value)}</p>
            </article>)}
        </section> : null}
      <PublicRecruitFromUs collegeName={college?.collegeName ?? ""}
        enabled={Boolean(published) && process.env.DB09_TPO_API_READY === "DB09_VERIFIED" &&
          process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY === "VERIFIED"} />
    </main>
  );
}
