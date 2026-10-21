import { PageHeader } from "@/components/ui/page-header";
import { Disclosure } from "@/components/ui/disclosure";
import { StatTile } from "@/components/ui/stat-tile";
import { Alert } from "@/components/ui/alert";
import { InlineNotice } from "@/components/ui/inline-notice";
import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoSettingsNav} from "@/components/placements/tpo-settings-nav";
import {TpoPublicPlacementToggle} from "@/components/placements/tpo-public-placement-toggle";
import {TpoPublicPlacementContentEditor} from "@/components/placements/tpo-public-placement-content-editor";
import {getPublicPlacementPageContent} from "@/modules/placements/public-page/content-service";
import {DEFAULT_PUBLIC_METRICS,PUBLIC_METRIC_LABELS,formatPublicPlacementMetric} from "@/modules/placements/public-page/content-model";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoPublicPlacementPublication} from "@/modules/placements/public-page/publication-service";
import {getPublicPlacementStatistics} from "@/modules/placements/public-page/read-service";
import {readOptionalPublicPlacementData} from "@/modules/placements/public-page/optional-read-model";
import {publicPlacementSettingState} from "@/modules/placements/public-page/publication-view-model";
export const dynamic="force-dynamic";

export default async function PublicPlacementSettingsPage({
 searchParams,
}: {searchParams:Promise<{updated?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const value=await getTpoPublicPlacementPublication(context);
 const view=publicPlacementSettingState(value);
 const preview=view.enabled?await readOptionalPublicPlacementData(()=>getPublicPlacementStatistics(context.membership!.collegeId)):null;
 const published=preview?.available?preview.value:null;
 const contentRead=await readOptionalPublicPlacementData(()=>getPublicPlacementPageContent(context.membership!.collegeId));
 const content=contentRead.available?contentRead.value:{ready:false as const,about:"",metricKeys:DEFAULT_PUBLIC_METRICS,updatedAt:null};
 const raw=await searchParams;
 const updated=Array.isArray(raw.updated)?raw.updated[0]:raw.updated;
 return <div className="min-w-0 space-y-6">
  <PageHeader title="Public placements" description={view.label} />
  <TpoSettingsNav active="public-page" compact/>
  <section className="min-w-0 space-y-4 border-t border-border pt-5">
   {updated==="1"?<InlineNotice tone="success" message={view.enabled?"Your placements page is live":"Your placements page is off"}/>:null}
   <p className="mt-2 text-sm text-body">
    The public page displays live, college-scoped results from the last 12 months only after you opt in.
    Publishing requires a consented cohort of at least five. Each student or offer statistic is independently suppressed when its group has fewer than five; passing the overall cohort threshold does not make every metric public.
   </p>
   {value.ready?<p className="mt-3 text-sm text-muted-foreground">
      Active consented placement cohort: {view.populationCount??"Unavailable"}
    </p>:null}
   {value.ready?<TpoPublicPlacementToggle enabled={view.enabled} canEnable={view.canEnable}/>:
    <Alert tone="warning">
     Public placement settings storage is unavailable until the registered migration is ready. No publication preference was changed.
    </Alert>}
   {value.ready&&!view.canEnable&&!view.enabled?<Alert tone="warning">Public statistics cannot be enabled without a recorded cohort of at least five.</Alert>:null}
   <Disclosure title="How your public placements look" className="mt-5 min-w-0 border-t border-border pt-4" contentClassName="min-w-0 pt-3">
   <section aria-label="Published placement preview" className="min-w-0 space-y-3">
    <p className="text-xs text-muted-foreground">Only actual, privacy-cleared public figures are previewed. Unpublished, stale or suppressed counts are not filled from private dashboards.</p>
    {!view.enabled?<Alert tone="info">Publication is off; this preview does not make any statistics public.</Alert>:null}
    {view.enabled&&!published?<Alert tone="warning">{preview?.available?"Not enough data yet. There is no current published snapshot to preview. Figures remain withheld.":"The published preview could not be loaded. Figures remain withheld."}</Alert>:null}
    {published?<p className="text-xs text-muted-foreground">Published as of {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(published.publishedAt))}.</p>:null}
    {published&&content.about?<p className="whitespace-pre-wrap text-sm text-body">{content.about}</p>:null}
    <div className="grid gap-3 min-[768px]:grid-cols-2">
     {content.metricKeys.map(key=><StatTile key={key} label={PUBLIC_METRIC_LABELS[key]} value={formatPublicPlacementMetric(key,{population:published?.population??null,placed:published?.placed??null,offers:published?.offers??null,employers:published?.employers??null,highestCtcInr:published?.highestCtcInr??null,medianCtcInr:published?.medianCtcInr??null})} className="min-h-[104px]" />)}
    </div>
   </section>
   </Disclosure>
   <TpoPublicPlacementContentEditor initial={content}/>
   <Link href="/placements" className="mt-4 inline-flex min-h-11 w-full items-center justify-center text-[13px] sm:w-auto sm:justify-start font-semibold text-[var(--lms-link-text)] underline min-[768px]:min-h-9">
     Open public placements page
   </Link>
  </section>
 </div>;
}
