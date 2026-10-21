import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {TpoSettingsNav} from "@/components/placements/tpo-settings-nav";
import {TpoLegacySettingsRedirect,TpoSettingsHashRedirect} from "@/components/tpo/tpo-legacy-settings-redirect";

/** Old bookmarks select a panel; an ordinary visit renders the legacy parent
 * heading and two-column section navigator instead of an invisible redirect. */
export default async function TpoSettingsIndex({searchParams}:{
 searchParams:Promise<{tab?:string|string[]}>
}){
 const params=await searchParams;
 const tab=Array.isArray(params.tab)?params.tab[0]:params.tab;
 if(tab)return <TpoLegacySettingsRedirect tab={tab}/>;
 return <div className="min-w-0 space-y-5">
  <TpoSettingsHashRedirect/>
  <PageHeader title="Settings" description="How your placement cell runs: its rules, its people, and what students and companies get."/>
  <div className="grid min-w-0 items-start gap-5 md:grid-cols-[14rem_minmax(0,1fr)]">
   <TpoSettingsNav active="rules"/>
   <section aria-label="Settings sections" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 md:p-6">
    <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Placement Rules</h2>
    <p className="text-sm leading-6 text-body">Choose a settings section to review the policy, people, and visibility options for this college. Changes are saved within each section.</p>
    <Link href="/tpo/settings/rules"
      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-white md:min-h-9">
     Open Placement Rules
    </Link>
    <p className="border-t border-border pt-3 text-xs text-muted-foreground">
     The left navigation stays available while you choose a settings category. Unsaved values on the current section are never changed by opening this overview.
    </p>
   </section>
  </div>
 </div>;
}
