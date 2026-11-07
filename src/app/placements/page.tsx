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
import { Heading } from "@/components/ui/heading";
import { istDateFormatter } from "@/lib/format-date";
import { runAsSystem } from "@/db/tenant-context";

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
async function PublicPlacementsPage() {
  const tenant = await resolveRequestTenant((await headers()).get("host"));
  // A failed domain-directory lookup is retryable, not proof of unpublication.
  if (tenant.kind === "unavailable") {
    throw new Error("PUBLIC_PLACEMENTS_TENANT_LOOKUP_UNAVAILABLE");
  }
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
    <div className="min-h-dvh bg-[color:var(--lms-neutral-50)] px-4 pb-[max(2rem,env(safe-area-inset-bottom))] pt-8 sm:pt-10">
      <main data-testid="placements.public" className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-5 sm:gap-6">
        <section className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6"
          aria-labelledby="placements-public-heading">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Public placements overview</p>
          <Heading level={1} size="2xl" id="placements-public-heading"
            className="m-0 break-words leading-tight text-[color:var(--lms-heading)] sm:text-[30px]">
            {college?.collegeName??"College placements"}
          </Heading>
          {published&&content?.about ? (
            <p className="mb-0 mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-body">
              {content.about}
            </p>
          ) : (
            <p className="mb-0 mt-3 text-sm leading-6 text-body">
              Placement information published by this college.
            </p>
          )}
        </section>
        <section aria-labelledby="public-placement-outcomes"
          className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6">
          <Heading level={2} size="lg" id="public-placement-outcomes"
            className="m-0 text-[color:var(--lms-heading)]">Placement outcomes</Heading>
          {visibleMetrics.length>0 ? (
            <>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                College-published figures for the 12 months preceding publication.
              </p>
              <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"
                aria-label="Public placements statistics">
                {visibleMetrics.map(metric=>(
                  <div key={metric.key}
                    className="min-w-0 rounded-[var(--lms-control-radius)] border border-border bg-[color:var(--lms-neutral-50)] p-4">
                    <dt className="break-words text-sm text-muted-foreground">{metric.label}</dt>
                    <dd className="mb-0 mt-2 break-words text-2xl font-semibold tabular-nums text-foreground">{metric.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p role="status" className="mb-0 mt-3 text-sm leading-6 text-body">
              Placement statistics are not available for public display.
            </p>
          )}
          {published ? (
            <p className="mb-0 mt-4 text-xs leading-5 text-muted-foreground">
              Published{" "}
              <time dateTime={published.publishedAt}>
                {istDateFormatter.format(new Date(published.publishedAt))}
              </time>. Individual student and employer records are not shown.
            </p>
          ) : null}
        </section>
        <section aria-label="Recruit from us"
          className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 sm:p-6 [&>section]:mt-0 [&>section]:border-0 [&>section]:p-0 [&>section]:shadow-none">
          <PublicRecruitFromUs collegeName={college?.collegeName ?? ""}
            enabled={Boolean(published) && process.env["DB09_TPO_API_READY"] === "DB09_VERIFIED" &&
              process.env["PUBLIC_JOIN_TRUSTED_PROXY_READY"] === "VERIFIED"}/>
        </section>
      </main>
    </div>
  );}

// Public page, no actor: runs in a named system scope so row-level security (when enforced) still lets it read
// the one record its link points at. The scope name shows in the database session.
export default async function PublicPlacementsPagePublic() {
  return runAsSystem("public-page:placements-index", () => PublicPlacementsPage());
}
