import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { headers } from "next/headers";
import {notFound} from "next/navigation";
import { PublicRecruitFromUs } from "@/components/placements/public-recruit-from-us";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import { publicPlacementDisclosure } from "@/modules/placements/public-placement-disclosure-model";
import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,formatPublicPlacementMetric} from "@/modules/placements/public-page/content-model";
import { getPublicPlacementStatistics } from "@/modules/placements/public-page/read-service";
import { publicPlacementTableReady } from "@/modules/placements/public-page/readiness";
import { readOptionalPublicPlacementData } from "@/modules/placements/public-page/optional-read-model";

/** Public route: never loads private placements, identities, or employer contacts.
 * A verified public publication producer and code delivery are still required
 * before displaying live numbers or accepting recruitment enquiries.
 *
 * Legacy college_placements_page mapping: enabled -> placement_public_page_settings.enabled,
 * about -> placement_public_page_content.about, numbers[] -> reviewed metric_keys +
 * ledger-backed aggregates, updated_by -> placements.public_page.* activity actor,
 * updated_at -> the separate settings/content update timestamps. A public read
 * requires enabled + published_at + fresh college-scoped aggregate evidence.
 * Do not infer a legacy updated_by actor from anonymous public reads.
 */
export default async function PublicPlacementsPage() {
  const tenant = await resolveRequestTenant((await headers()).get("host"));
  if (tenant.kind !== "college") notFound();
  // A missing/unfinished publication table is an infrastructure error,
  // not evidence that a college explicitly unpublished its page.
  if (!await publicPlacementTableReady()) {
    throw new Error("PUBLIC_PLACEMENTS_PUBLICATION_NOT_READY");
  }
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
  // A transient database failure is not an unpublished page. Render the
  // route-level, retryable error boundary instead of a partial empty page.
  if (brandRead?.available === false ||
      publicRead?.available === false ||
      contentRead?.available === false ||
      content?.ready === false) {
    throw new Error("PUBLIC_PLACEMENTS_TEMPORARILY_UNAVAILABLE");
  }
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
    <main className="mx-auto my-4 min-h-[calc(100vh-2rem)] w-full max-w-4xl rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 shadow-none min-[768px]:p-6">
      <header className="space-y-3">
        <PageHeader title={college?.collegeName??"College placements"} />
      </header>
      {published && metrics.some(metric=>!metric.suppressed) ? (
        <p className="mt-5 text-xs text-muted-foreground">
          College-published figures last updated{" "}
          <time dateTime={published.publishedAt}>{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(published.publishedAt))}</time>.
          Individual records are never displayed here.
        </p>
      ) : null}
      {published&&content?.about?<section className="mt-7 space-y-2">
       <h2 className="text-[16px] font-semibold leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-7 min-[992px]:text-[20px] min-[992px]:leading-[30px]">About your placements</h2>
       <p className="whitespace-pre-wrap break-words text-sm text-body">{content.about}</p>
      </section>:null}
      {published?<p className="mt-8 text-xs text-muted-foreground">Live numbers over the last 12 months.</p>:null}
      <section aria-label="Placement results" className="mt-4 grid min-w-0 gap-3 min-[768px]:grid-cols-2 min-[992px]:grid-cols-3">
        {metricKeys.flatMap(key=>{
 const value=formatPublicPlacementMetric(key,{population:published?.population??null,
   placed:published?.placed??null,offers:published?.offers??null,
   employers:published?.employers??null,highestCtcInr:published?.highestCtcInr??null,
   medianCtcInr:published?.medianCtcInr??null});
 return value===null?[]:[<StatTile key={key} label={PUBLIC_METRIC_LABELS[key]}
   value={value} className="min-h-[104px]" />];
})}
      </section>
      <PublicRecruitFromUs collegeName={college?.collegeName ?? ""}
        enabled={Boolean(published) && process.env.DB09_TPO_API_READY === "DB09_VERIFIED" &&
          process.env.PUBLIC_JOIN_TRUSTED_PROXY_READY === "VERIFIED"} />
    </main>
  );
}
