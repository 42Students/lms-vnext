import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {TpoOptionalEmailsEditor} from "@/components/tpo/tpo-optional-emails-editor";
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
  // This Settings summary is college-wide, not only notices authored by
  // the currently signed-in officer. The source reader caps each page at 100.
  listTpoPlacementAnnouncements(ctx,"yours",new Date(),1,"COLLEGE"),
  getTpoPrepReadiness(ctx),getTpoCommunicationSettings(ctx),
 ]);
 const destinations=tpoStudentNoticeNavigation();
 const view=tpoStudentNoticesOverview({announcementsReady:announcements.status==="READY",
  noticeCount:announcements.items.length,prepReady:prep.ready,
  hasMore:announcements.status==="READY"&&announcements.hasMore});
 return <div className="min-w-0 space-y-5">
  <div className="print:hidden"><TpoSettingsNav active="notices"/></div>
  <PageHeader title="Student Notices & Preparation" />
  <p className="text-sm text-body">Use registered placement announcements and preparation settings. This page does not enable email/SMS delivery, bulk learner targeting or unregistered configuration switches.</p>
  <section className="space-y-3 border-t border-border pt-5">
   <h2 className="font-semibold">College placement notices</h2>
   <p className="text-sm" role="status">{view.publishedSummary}</p>
   <p className="text-xs text-muted-foreground">The count describes only the current announcements reader result, not confirmed individual delivery or read receipts.</p>
   <Link href={view.noticeHref} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">Manage actual placement announcements</Link>
  </section>
  <section className="space-y-3 border-t border-border pt-5">
   <h2 className="font-semibold">Preparation &amp; readiness</h2>
   <p role="status" className="text-sm">{view.prepSummary}</p>
   <Link href={view.prepHref} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">Configure available preparation courses</Link>
  </section>
  {communication.ready?<TpoSmsCapEditor key={ctx.membership?.collegeId??"unscoped"} initial={communication.smsMonthlyCap} version={communication.version}/>:
   <Alert tone="warning">Communication settings are not available in this database.</Alert>}
  {communication.ready?<TpoOptionalEmailsEditor key={ctx.membership?.collegeId??"unscoped"} initial={{
    notifyDriveOpenEmail:communication.notifyDriveOpenEmail,
    notifyResultApplied:communication.notifyResultApplied,
    notifyNudges:communication.notifyNudges,notifyPrepAssigned:communication.notifyPrepAssigned,
   }} version={communication.version}/>:null}
   <section className="space-y-2 border-t border-border pt-5">
    <h2 className="font-semibold">SMS</h2>
    <p className="text-sm font-medium">Always sent (email and SMS), never counted against the limit</p>
    <div className="flex flex-wrap gap-2">{["Round scheduled or changed",
     "Offer released, expiring, expired or withdrawn","Drive cancelled",
     "Application deadline today","Debarred or marked absent"].map(label=>
     <Badge key={label}  tone="neutral">{label}</Badge>)}</div>
    <p className="text-xs text-muted-foreground">These are legacy notification categories. Actual email/SMS delivery is not certified without provider status.</p>
   </section>
  <section className="space-y-2 border-t border-border pt-5">
   <h2 className="text-lg font-semibold">Emails switched on</h2>
   <Alert tone="warning">Couldn&apos;t check which emails are switched on.</Alert>
   <p className="text-xs text-muted-foreground">Mail delivery configuration and provider template status are not available to this reader. In-app notices remain available.</p>
   <Link href="/tpo/settings/templates" className="lms-inline-link inline-flex min-h-11 items-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">View available message templates</Link>
  </section>
  <nav aria-label="Notice and notification destinations" className="flex flex-wrap gap-4 text-sm print:hidden">
    <Link href={destinations.inbox} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">Open personal notifications inbox</Link>
    <Link href={destinations.preferences} className="lms-inline-link inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 print:hidden">Review notification preferences</Link>
  </nav>
 </div>;
}
