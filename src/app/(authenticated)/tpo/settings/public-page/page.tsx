import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoSettingsNav} from "@/components/placements/tpo-settings-nav";
import {hasMembershipRole} from "@/modules/identity/context";
import {getTpoPublicPlacementPublication} from "@/modules/placements/public-page/publication-service";
import {publicPlacementSettingState} from "@/modules/placements/public-page/publication-view-model";
export const dynamic="force-dynamic";

export default async function PublicPlacementSettingsPage({
 searchParams,
}: {searchParams:Promise<{updated?:string|string[]}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const value=await getTpoPublicPlacementPublication(context);
 const view=publicPlacementSettingState(value);
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
   {value.ready&&value.settings?<p className="mt-3 text-sm text-muted-foreground">
      Recorded cohort: {value.settings.populationCount??"Not recorded"}
    </p>:null}
   {value.ready&&value.settings?
    <form action="/api/placements/tpo/public-placement" method="post" className="mt-4">
     <input type="hidden" name="enabled" value={view.enabled?"false":"true"}/>
     <button type="submit" disabled={!view.enabled&&!view.canEnable}
       className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
      {view.enabled?"Disable public statistics":"Enable public statistics"}
     </button>
    </form>:null}
   {!view.canEnable&&!view.enabled?<p role="status" className="mt-3 text-sm text-muted-foreground">
     Public statistics cannot be enabled without a recorded cohort of at least five.
    </p>:null}
   <Link href="/placements" className="mt-4 inline-block text-sm text-primary-text underline">
     Open public placements page
   </Link>
  </section>
 </div>;
}
