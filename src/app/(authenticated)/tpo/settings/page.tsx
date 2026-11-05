import TpoPlacementRulesSettingsPage from "./rules/page";
import {TpoLegacySettingsRedirect,TpoSettingsHashRedirect} from "@/components/tpo/tpo-legacy-settings-redirect";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";

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
    <TextLink href="/tpo/settings/season">Placement season</TextLink>
    <TextLink href="/tpo/settings/public-page">Public placements settings</TextLink>
    <TextLink href="/tpo/settings/notifications">Notifications</TextLink>
    <TextLink href="/tpo/settings/templates">Templates</TextLink>
   </nav>
  </Disclosure>
 </div>;
}
