import Link from "next/link";
import TpoPlacementRulesSettingsPage from "./rules/page";
import {TpoLegacySettingsRedirect,TpoSettingsHashRedirect} from "@/components/tpo/tpo-legacy-settings-redirect";
import { Disclosure } from "@/components/ui/disclosure";

/** The Settings screenshot opens directly on live placement rules. The
 * previous index's extra destinations remain available in a secondary
 * disclosure; deep-linked legacy ?tab= bookmarks still resolve as before. */
export default async function TpoSettingsIndex({searchParams}:{
 searchParams:Promise<{tab?:string|string[]}>
}){
 const params=await searchParams;
 const tab=Array.isArray(params.tab)?params.tab[0]:params.tab;
 if(tab)return <TpoLegacySettingsRedirect tab={tab}/>;
 return <div className="min-w-0 space-y-4" data-testid="tpo.settings.prototype-rules">
  <TpoSettingsHashRedirect/>
  <TpoPlacementRulesSettingsPage searchParams={Promise.resolve({})}/>
  <Disclosure title="Other placement settings">
   <nav aria-label="Other placement settings" className="flex flex-wrap gap-4 border-t border-border p-4 text-sm">
    <Link href="/tpo/settings/season" className="font-semibold text-link underline">Placement season</Link>
    <Link href="/tpo/settings/public-page" className="font-semibold text-link underline">Public placements settings</Link>
    <Link href="/tpo/settings/notifications" className="font-semibold text-link underline">Notifications</Link>
    <Link href="/tpo/settings/templates" className="font-semibold text-link underline">Templates</Link>
   </nav>
  </Disclosure>
 </div>;
}
