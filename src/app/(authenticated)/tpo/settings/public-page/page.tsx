import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoSettingsNav} from "@/components/placements/tpo-settings-nav";
import {TpoPublicPlacementToggle} from "@/components/placements/tpo-public-placement-toggle";
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
 const raw=await searchParams;
 const updated=Array.isArray(raw.updated)?raw.updated[0]:raw.updated;
 return <div className="space-y-6">
  <TpoSettingsNav active="public-page"/>
  <section className="rounded-xl border border-border bg-surface p-5">
   <h1 className="text-xl font-semibold">Public placements</h1>
   <p className="mt-2 text-sm text-body">{view.label}</p>
   {updated==="1"?<p role="status" className="mt-2 text-sm">Publication preference updated.</p>:null}
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
   <Link href="/placements" className="mt-4 inline-block text-sm text-primary-text underline">
     Open public placements page
   </Link>
  </section>
 </div>;
}
