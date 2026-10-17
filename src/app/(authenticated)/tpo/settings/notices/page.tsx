import Link from "next/link";
import {TpoSmsCapEditor} from "@/components/tpo/tpo-communication-settings-editors";
import {getTpoCommunicationSettings} from "@/modules/placements/tpo-communication-settings-service";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoSettingsNav} from "@/components/placements/tpo-settings-nav";
import {listTpoPlacementAnnouncements} from "@/modules/announcements/tpo-placement-read-service";
import {getTpoPrepReadiness} from "@/modules/placements/tpo-configuration-read-service";
import {tpoStudentNoticesOverview} from "@/modules/placements/tpo-student-notices-overview-model";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
import {tpoStudentNoticeNavigation} from "@/modules/placements/tpo-student-notice-navigation-model";
export const dynamic="force-dynamic";
export default async function TpoStudentNoticesSettings(){
 const ctx=await getCurrentRequestContext();
 await requireTpoBatchActor(ctx);
 const [announcements,prep,communication]=await Promise.all([
  listTpoPlacementAnnouncements(ctx,"yours"),getTpoPrepReadiness(ctx),getTpoCommunicationSettings(ctx),
 ]);
 const destinations=tpoStudentNoticeNavigation();
 const view=tpoStudentNoticesOverview({announcementsReady:announcements.status==="READY",noticeCount:announcements.items.length,prepReady:prep.ready});
 return <main className="min-w-0 space-y-5">
  <TpoSettingsNav active="notices"/>
  <h1 className="text-xl font-semibold">Student Notices &amp; Preparation</h1>
  <p className="text-sm text-body">Use registered placement announcements and preparation settings. This page does not enable email/SMS delivery, bulk learner targeting or unregistered configuration switches.</p>
  <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold">College placement notices</h2>
   <p className="text-sm" role="status">{view.publishedSummary}</p>
   <p className="text-xs text-muted-foreground">The count describes only the current announcements reader result, not confirmed individual delivery or read receipts.</p>
   <Link href={view.noticeHref} className="inline-flex min-h-11 items-center text-primary-text underline">Manage actual placement announcements</Link>
  </section>
  <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold">Preparation &amp; readiness</h2>
   <p role="status" className="text-sm">{view.prepSummary}</p>
   <Link href={view.prepHref} className="inline-flex min-h-11 items-center text-primary-text underline">Configure available preparation courses</Link>
  </section>
  {communication.ready?<TpoSmsCapEditor initial={communication.smsMonthlyCap} version={communication.version}/>:
   <p role="status" className="rounded-lg border border-border p-4 text-sm">Communication settings are not available in this database.</p>}
  <section className="space-y-2 rounded-xl border border-border bg-surface p-5">
   <h2 className="text-lg font-semibold">Optional emails</h2>
   <p className="text-sm">Switch off what your students do not need. The in-app notice always shows; these control only the email.</p>
   <p className="text-sm text-muted-foreground">Email template delivery status cannot be verified here until the configured mail provider is connected.</p>
  </section>
  <nav aria-label="Notice and notification destinations" className="flex flex-wrap gap-4 text-sm">
    <Link href={destinations.inbox} className="inline-flex min-h-11 items-center text-primary-text underline">Open personal notifications inbox</Link>
    <Link href={destinations.preferences} className="inline-flex min-h-11 items-center text-primary-text underline">Review notification preferences</Link>
  </nav>
 </main>;
}
