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
 return <div className="space-y-6">
  <TpoSettingsNav active="public-page"/>
  <section className="rounded-xl border border-border bg-surface p-5">
   <h1 className="text-xl font-semibold">Public placements</h1>
   <p className="mt-2 text-sm text-body">{view.label}</p>
   {updated==="1"?<p role="status" className="mt-2 text-sm">{view.enabled?"Your placements page is live":"Your placements page is off"}</p>:null}
   <p className="mt-2 text-sm text-body">
    The public page displays live, college-scoped results from the last 12 months only after you opt in.
    Metrics below the publication threshold of five are not shown.
   </p>
   {value.ready?<p className="mt-3 text-sm text-muted-foreground">
      Active consented placement cohort: {view.populationCount??"Unavailable"}
    </p>:null}
   {value.ready?<TpoPublicPlacementToggle enabled={view.enabled} canEnable={view.canEnable}/>:
    <p role="status" className="mt-3 rounded-md border border-border p-3 text-sm text-warning-text">
     Public placement settings storage is unavailable until the registered migration is ready. No publication preference was changed.
    </p>}
   {value.ready&&!view.canEnable&&!view.enabled?<p role="status" className="mt-3 text-sm text-muted-foreground">
     Public statistics cannot be enabled without a recorded cohort of at least five.
    </p>:null}
   <section aria-label="Published placement preview" className="mt-5 space-y-3 rounded-xl border border-border bg-surface-subtle p-4">
    <h2 className="font-semibold">How your public placements look</h2>
    <p className="text-xs text-muted-foreground">Only actual, privacy-cleared public figures are previewed. Unpublished, stale or suppressed counts are not filled from private dashboards.</p>
    {!view.enabled?<p role="status" className="text-sm text-body">Publication is off; this preview does not make any statistics public.</p>:null}
    {view.enabled&&!published?<p role="status" className="text-sm text-warning-text">{preview?.available?"Not enough data yet. There is no current published snapshot to preview. Figures remain withheld.":"The published preview could not be loaded. Figures remain withheld."}</p>:null}
    {published?<p className="text-xs text-muted-foreground">Published as of {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(published.publishedAt))}.</p>:null}
    {published&&content.about?<p className="whitespace-pre-wrap text-sm text-body">{content.about}</p>:null}
    <div className="grid gap-3 sm:grid-cols-2">
     {content.metricKeys.map(key=><div key={key} className="rounded-lg border border-border bg-surface p-3">
      <p className="text-xs text-muted-foreground">{PUBLIC_METRIC_LABELS[key]}</p>
      <p className="mt-1 font-semibold">{formatPublicPlacementMetric(key,{
       population:published?.population??null,placed:published?.placed??null,
       offers:published?.offers??null,employers:published?.employers??null,
       highestCtcInr:published?.highestCtcInr??null,medianCtcInr:published?.medianCtcInr??null,
      })}</p>
     </div>)}
    </div>
   </section>
   <TpoPublicPlacementContentEditor initial={content}/>
   <Link href="/placements" className="mt-4 inline-block text-sm text-primary-text underline">
     Open public placements page
   </Link>
  </section>
 </div>;
}
