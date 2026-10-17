import { headers } from "next/headers";
import {notFound} from "next/navigation";
import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";
import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,formatPublicPlacementMetric} from "@/modules/placements/public-page/content-model";
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
  const contentRead=tenant.kind==="college"?await readOptionalPublicPlacementData(()=>getPublicPlacementPageContent(tenant.collegeId)):null;
  const content=contentRead?.available?contentRead.value:null;
  const metricKeys=content?.metricKeys??DEFAULT_PUBLIC_METRICS;
  // An unknown host or an explicitly unpublished college page must be a 404.
  // An unavailable database is not evidence that the college unpublished it.
  if(tenant.kind!=="college"||(brandRead?.available&&!college)||
   (publicRead?.available&&!published))notFound();
  const metrics = publicPlacementDisclosure([
    { label: "Students placed", count: published?.placed ?? null },
    { label: "Offers received", count: published?.offers ?? null },
    { label: "Recruiting employers", count: published?.employers ?? null },
  ]);
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
      {published&&content?.about?<section className="mt-7 space-y-2">
       <h2 className="text-lg font-semibold">About your placements</h2>
       <p className="whitespace-pre-wrap break-words text-sm text-body">{content.about}</p>
      </section>:null}
      {published?<p className="mt-8 text-xs text-muted-foreground">Live numbers over the last 12 months.</p>:null}
      <section aria-label="Placement results" className="mt-4 grid min-w-0 gap-3 sm:grid-cols-3">
        {metricKeys.map(key=><article key={key}
         className="min-w-0 rounded-xl border border-border bg-surface p-5">
         <h2 className="text-sm font-medium text-muted-foreground">{PUBLIC_METRIC_LABELS[key]}</h2>
         <p className="mt-3 break-words text-lg font-semibold text-foreground">
          {formatPublicPlacementMetric(key,{
           population:published?.population??null,placed:published?.placed??null,
           offers:published?.offers??null,employers:published?.employers??null,
           highestCtcInr:published?.highestCtcInr??null,medianCtcInr:published?.medianCtcInr??null,
          })}
         </p>
        </article>)}
      </section>
      <PublicRecruitFromUs collegeName={college?.collegeName ?? ""}
        enabled={Boolean(published) && process.env.DB09_TPO_API_READY === "DB09_VERIFIED" &&
          process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY === "VERIFIED"} />
    </main>
  );
}
