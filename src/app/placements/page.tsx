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
  // The publication service suppresses non-disclosable aggregates. This final
  // presentation gate keeps selected metrics in their configured order and
  // never renders an empty tile for a withheld value.
  const countDisclosure:Readonly<Partial<Record<string,string>>> = {
    PLACED:"Students placed",OFFERS:"Offers received",
    HIRING_COMPANIES:"Recruiting employers",
  };
  const visibleMetrics=metricKeys.flatMap(key=>{
    const label=countDisclosure[key];
    if(label&&metrics.find(item=>item.label===label)?.suppressed)return [];
    const value=formatPublicPlacementMetric(key,{
      population:published?.population??null,placed:published?.placed??null,
      offers:published?.offers??null,employers:published?.employers??null,
      highestCtcInr:published?.highestCtcInr??null,
      medianCtcInr:published?.medianCtcInr??null,
    });
    return value===null?[]:[{key,label:PUBLIC_METRIC_LABELS[key],value}];
  });
  return (
    <div className="min-h-screen bg-[#f5f7f9] px-4 py-8">
      <main data-testid="placements.public" className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
        <section className="min-w-0 rounded-[8px] border border-[#e5e9f0] bg-white p-5 shadow-none sm:p-6"
          aria-labelledby="placements-public-heading">
          <h1 id="placements-public-heading" className="m-0 break-words text-[26px] font-semibold leading-tight text-[#172033] sm:text-[30px]">
            {college?.collegeName??"College placements"}
          </h1>
          {published&&content?.about ? (
            <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-body">
              {content.about}
            </p>
          ) : null}
          {visibleMetrics.length>0 ? (
            <>
              <dl className="mt-8 flex flex-wrap gap-8" aria-label="Public placements statistics">
                {visibleMetrics.map(metric=>(
                  <div key={metric.key} className="min-w-[110px] max-w-full">
                    <dt className="text-sm text-muted-foreground">{metric.label}</dt>
                    <dd className="mt-1 break-words text-2xl font-semibold tabular-nums text-foreground">
                      {metric.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mb-0 mt-3 text-sm text-muted-foreground">
                Live numbers over the last 12 months.
              </p>
              {published ? <p className="mt-1 text-xs text-muted-foreground">
                College-published figures last updated{" "}
                <time dateTime={published.publishedAt}>
                  {new Intl.DateTimeFormat("en-IN",{
                    dateStyle:"medium",timeZone:"Asia/Kolkata",
                  }).format(new Date(published.publishedAt))}
                </time>. Individual records are never displayed here.
              </p> : null}
            </>
          ) : null}
        </section>
        <section aria-label="Recruit from us" className="min-w-0 rounded-[8px] border border-[#e5e9f0] bg-white p-5 shadow-none sm:p-6 [&>section]:mt-0 [&>section]:border-t-0 [&>section]:pt-0">
          <PublicRecruitFromUs collegeName={college?.collegeName ?? ""}
            enabled={Boolean(published) && process.env["DB09_TPO_API_READY"] === "DB09_VERIFIED" &&
              process.env["PUBLIC_JOIN_TRUSTED_PROXY_READY"] === "VERIFIED"}/>
        </section>
      </main>
    </div>
  );
}
