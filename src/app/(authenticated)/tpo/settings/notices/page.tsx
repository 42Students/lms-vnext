import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {TpoSettingsNav} from "@/components/placements/tpo-settings-nav";
import {listTpoPlacementAnnouncements} from "@/modules/announcements/tpo-placement-read-service";
import {getTpoPrepReadiness} from "@/modules/placements/tpo-configuration-read-service";
import {tpoStudentNoticesOverview} from "@/modules/placements/tpo-student-notices-overview-model";
import {requireTpoBatchActor} from "@/modules/placements/tpo-batch-workspace-read-service";
export const dynamic="force-dynamic";
export default async function TpoStudentNoticesSettings(){
 const ctx=await getCurrentRequestContext();
 await requireTpoBatchActor(ctx);
 const [announcements,prep]=await Promise.all([
  listTpoPlacementAnnouncements(ctx,"yours"),getTpoPrepReadiness(ctx),
 ]);
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
  <Link href="/tpo/settings/notifications" className="text-sm text-primary-text underline">Review my personal notification preferences</Link>
 </main>;
}
