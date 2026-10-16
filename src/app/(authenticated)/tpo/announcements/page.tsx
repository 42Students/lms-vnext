import Link from "next/link";
import {canUndoTpoAnnouncementSend} from "@/modules/announcements/tpo-notice-undo-model";
import {TpoNoticeReadProgress} from "@/components/tpo/tpo-notice-read-progress";
import {canPublishTpoNoticeWithCurrentStorage} from "@/modules/announcements/tpo-notice-audience-snapshot-model";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {listTpoPlacementAnnouncements} from "@/modules/announcements/tpo-placement-read-service";
import {previewTpoCollegeAnnouncementVisibility,previewTpoPlacementAudience} from "@/modules/announcements/tpo-audience-preview-service";
import {announcementPreviewScope,tpoAudiencePreviewQuery} from "@/modules/announcements/tpo-audience-preview-query";
import {tpoAnnouncementTabSchema} from "@/modules/announcements/tpo-placement-read-model";
type Props={searchParams:Promise<{tab?:string|string[];audience?:string|string[];targetId?:string|string[]}>};
export default async function TpoAnnouncements({searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const raw=await searchParams;
 const t=Array.isArray(raw.tab)?raw.tab[0]:raw.tab;
 const tab=tpoAnnouncementTabSchema.safeParse(t??"yours");
 if(!tab.success)return <main role="alert" className="p-5">Invalid tab. <Link href="/tpo/announcements">Return to announcements</Link></main>;
 const result=await listTpoPlacementAnnouncements(context,tab.data);
 const targetedReady=await placementTableExists("placement_tpo_notice_audiences")&&
  await placementTableExists("placement_tpo_notice_recipients");
 const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
 const query=tpoAudiencePreviewQuery.safeParse({
  audience:first(raw.audience)??"COLLEGE",
  targetId:first(raw.targetId)||undefined,
 });
 const isPreview=result.status==="READY"&&tab.data==="yours";
 const selected=query.success?announcementPreviewScope(query.data):null;
 const audience=isPreview&&query.success
  ?selected?await previewTpoPlacementAudience(context,selected)
   :await previewTpoCollegeAnnouncementVisibility(context)
  :null;
 return <main className="space-y-6">
  <PageHeader eyebrow="TPO · Communications" title="Announcements"
   description="College-wide notices for this college. Removal and undo are author-only and version checked; external reminders remain unavailable."/>
  {result.status==="READY" && tab.data==="yours"?<section className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold text-foreground">Compose a college notice</h2>
   <p className="mt-1 text-sm text-body">Only active college members can see published notices; this form does not send email or SMS.</p>
   <form method="get" action="/tpo/announcements"
     className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-border p-3"
     aria-label="Announcement audience preview">
     <input type="hidden" name="tab" value="yours"/>
     <label className="grid gap-1 text-sm">Audience
       <select name="audience" defaultValue={query.success?query.data.audience:"COLLEGE"}
         className="min-h-11 rounded-md border border-border bg-surface px-3">
         <option value="COLLEGE">COLLEGE</option>
         <option value="PLACEMENTS">PLACEMENTS</option>
         <option value="BATCHES">BATCHES</option>
         <option value="BRANCHES">BRANCHES</option>
         <option value="DRIVE">DRIVE</option>
       </select>
     </label>
     <label className="grid gap-1 text-sm">Target ID (batch, branch or drive)
       <input name="targetId" defaultValue={first(raw.targetId)??""}
         className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
     <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">Preview audience</button>
   </form>
   {!query.success?<p role="alert" className="mt-2 text-sm">Choose a valid audience and target ID.</p>:null}
   {audience?<div role="status" className="mt-3 rounded-lg border border-border p-3">
     <p className="text-sm font-semibold text-foreground">Current {query.success?query.data.audience.toLowerCase():"college"} visibility preview</p>
     <p className="mt-1 text-sm text-body">{audience.potentiallyVisibleMemberships} active memberships with active platform accounts.</p>
     <p className="mt-1 text-xs text-muted-foreground">This is an estimate, not a send or delivery count. It excludes inactive memberships and disabled users. The selected audience determines recipient visibility when targeted storage is ready.</p>
   </div>:null}
   {query.success&&!canPublishTpoNoticeWithCurrentStorage(query.data.audience,targetedReady)?
    <p role="alert" className="mt-4 rounded-md border border-border p-3 text-sm">
      Targeted announcement publishing is not ready. This audience preview cannot be published
      until fixed recipient storage is registered. Choose COLLEGE only to publish to the whole college.
    </p>:null}
   <form action="/api/placements/tpo/announcements" method="post" className="mt-4 space-y-3">
    <input type="hidden" name="audience" value={query.success?query.data.audience:"COLLEGE"}/>
    {query.success&&query.data.targetId?<input type="hidden" name="targetId" value={query.data.targetId}/>:null}
    <label className="grid gap-1 text-sm font-semibold">Title
     <input name="title" required maxLength={255} className="min-h-11 rounded-md border border-border bg-surface px-3" />
    </label>
    <label className="grid gap-1 text-sm font-semibold">Message
     <textarea name="message" required maxLength={10000} rows={5} className="rounded-md border border-border bg-surface p-3" />
    </label>
    <label className="grid gap-1 text-sm">Send at (IST, optional)
      <input type="datetime-local" name="sendAt" className="min-h-11 rounded-md border border-border bg-surface px-3"/>
    </label>
    <label className="grid gap-1 text-sm">Show until (IST, optional)
      <input type="datetime-local" name="showUntil" className="min-h-11 rounded-md border border-border bg-surface px-3"/>
    </label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> Pin this notice</label>
    <button type="submit" disabled={!query.success||!canPublishTpoNoticeWithCurrentStorage(query.data.audience,targetedReady)}
      className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
      {query.success&&query.data.audience!=="COLLEGE"?"Publish to selected audience":"Publish college notice"}
    </button>
   </form>
  </section>:null}
  <nav aria-label="Announcement tabs" className="flex flex-wrap gap-2">
   {([["yours","Yours"],["from-42","From 42"],["deleted","Recently removed"]] as const).map(([value,label])=><Link
    key={value} href={"/tpo/announcements?tab="+value} aria-current={value===tab.data?"page":undefined}
    className={value===tab.data?"inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm text-on-primary":
    "inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-body"}>{label}</Link>)}
  </nav>
  {result.status==="NOT_REGISTERED"?<section role="status" className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold text-foreground">Announcement storage pending</h2>
   <p className="mt-2 text-sm text-body">The announcements table has not been registered. No notices or audience counts are inferred from unrelated notifications.</p>
  </section>:result.items.length?<ol className="grid gap-3 md:grid-cols-2">
   {result.items.map(row=><li key={row.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <h2 className="break-words font-semibold text-foreground">{row.title}{row.isPinned?" · Pinned":""}</h2>
    {tab.data==="yours" && row.scheduledAt && new Date(row.scheduledAt)>new Date()?
      <p role="status" className="mt-2 text-sm font-semibold text-amber-700">Scheduled for {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(row.scheduledAt))} IST</p>:
      tab.data==="yours"&&row.expiresAt&&new Date(row.expiresAt)<=new Date()?
      <p role="status" className="mt-2 text-sm font-semibold text-muted-foreground">Ended</p>:null}
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{row.message}</p>
    {tab.data==="yours"&&row.senderUserId===context.user.id?<TpoNoticeReadProgress id={row.id}/>:null}
    {tab.data==="yours" && row.senderUserId===context.user.id ?
     <details className="mt-4 rounded-lg border border-border p-3">
      <summary className="cursor-pointer text-sm font-semibold text-primary-text">Edit notice</summary>
      <form method="post" action={"/api/placements/tpo/announcements/"+row.id+"/edit"} className="mt-3 grid gap-3">
       <input type="hidden" name="expectedVersion" value={row.version}/>
       <label className="grid gap-1 text-sm text-body">Title
        <input name="title" required maxLength={255} defaultValue={row.title}
         className="min-h-11 rounded-md border border-border bg-surface px-3"/>
       </label>
       <label className="grid gap-1 text-sm text-body">Message
        <textarea name="message" rows={5} required maxLength={10000} defaultValue={row.message}
         className="rounded-md border border-border bg-surface p-3"/>
       </label>
       <label className="grid gap-1 text-sm text-body">Send at (IST)
        <input type="datetime-local" name="sendAt"
         defaultValue={row.scheduledAt?new Date(new Date(row.scheduledAt).getTime()+330*60000).toISOString().slice(0,16):""}
         className="min-h-10 rounded border border-border bg-surface px-3"/>
       </label>
       <label className="grid gap-1 text-sm text-body">Show until (IST)
        <input type="datetime-local" name="showUntil"
         defaultValue={row.expiresAt?new Date(new Date(row.expiresAt).getTime()+330*60000).toISOString().slice(0,16):""}
         className="min-h-10 rounded border border-border bg-surface px-3"/>
       </label>
       <label className="flex items-center gap-2 text-sm text-body">
        <input name="pinned" type="checkbox" defaultChecked={row.isPinned}/> Pinned
       </label>
       <p className="text-xs text-muted-foreground">Save fails if the notice changed since this page was loaded.</p>
       <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Save notice edits</button>
      </form>
     </details>:null}
    {((tab.data==="yours"&&row.senderUserId===context.user.id)||tab.data==="deleted")?
     <form method="post" action={"/api/placements/tpo/announcements/"+row.id+"/lifecycle"}
      className="mt-4 flex flex-wrap gap-2">
      <input type="hidden" name="expectedVersion" value={row.version}/>
      <input type="hidden" name="action" value={tab.data==="deleted"?"RESTORE":"DELETE"}/>
      <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">
       {tab.data==="deleted"?"Undo removal":"Remove notice"}
      </button>
     </form>:null}
    {tab.data==="yours"&&row.senderUserId===context.user.id&&
     canUndoTpoAnnouncementSend(row.createdAt,new Date())?
     <form method="post" action={"/api/placements/tpo/announcements/"+row.id+"/lifecycle"}
      className="mt-2">
      <input type="hidden" name="expectedVersion" value={row.version}/>
      <input type="hidden" name="action" value="UNDO_SEND"/>
      <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">
       Undo send (30 seconds)
      </button>
     </form>:null}
    <p className="mt-3 text-xs text-muted-foreground">
     {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(row.createdAt)} IST</p>
   </li>)}
  </ol>:<p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
   No currently visible college-wide announcements from this sender.</p>}
 </main>;
}
