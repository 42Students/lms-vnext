import Link from "next/link";
import {tpoNoticeTextParts} from "@/modules/announcements/tpo-notice-safe-links";
import {TpoPlacementCellReadAction} from "@/components/tpo/tpo-placement-cell-read-action";
import {TpoNoticeDeleteConfirm} from "@/components/tpo/tpo-notice-delete-confirm";
import {TpoNoticeComposerDialog} from "@/components/tpo/tpo-notice-composer-dialog";
import {TpoNoticeAudiencePicker} from "@/components/tpo/tpo-notice-audience-picker";
import {listTpoNoticeTargetOptions} from "@/modules/announcements/tpo-notice-target-options-service";
import {tpoNoticeFormErrorMessage} from "@/modules/announcements/tpo-notice-form-error-model";
import {canUndoTpoAnnouncementSend} from "@/modules/announcements/tpo-notice-undo-model";
import {TpoNoticeReadProgress} from "@/components/tpo/tpo-notice-read-progress";
import {TpoNoticeUndoToast} from "@/components/tpo/tpo-notice-undo-toast";
import {TpoNoticeDraftGuard} from "@/components/tpo/tpo-notice-draft-guard";
import {TpoNoticeScheduleControls} from "@/components/tpo/tpo-notice-schedule-controls";
import {canPublishTpoNoticeWithCurrentStorage} from "@/modules/announcements/tpo-notice-audience-snapshot-model";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {listTpoPlacementAnnouncements,countUnreadTpo42Announcements} from "@/modules/announcements/tpo-placement-read-service";
import {previewTpoCollegeAnnouncementVisibility,previewTpoPlacementAudience} from "@/modules/announcements/tpo-audience-preview-service";
import {announcementPreviewScope,tpoAudiencePreviewQuery} from "@/modules/announcements/tpo-audience-preview-query";
import {tpoAnnouncementTabSchema} from "@/modules/announcements/tpo-placement-read-model";
type Props={searchParams:Promise<{tab?:string|string[];audience?:string|string[];targetId?:string|string[];noticeError?:string|string[];sentNotice?:string|string[];page?:string|string[];noticeSuccess?:string|string[]}>};
export default async function TpoAnnouncements({searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const raw=await searchParams;
 const t=Array.isArray(raw.tab)?raw.tab[0]:raw.tab;
 const legacyTab=t==="from42"?"from-42":t==="students"?"yours":t;
 const tab=tpoAnnouncementTabSchema.safeParse(legacyTab??"yours");
 if(!tab.success)return <main role="alert" className="p-5">Invalid tab. <Link href="/tpo/announcements">Return to announcements</Link></main>;
 const pageValue=Array.isArray(raw.page)?raw.page[0]:raw.page;
 const page=pageValue&&/^[1-9][0-9]{0,3}$/.test(pageValue)?Math.min(1000,Number(pageValue)):1;
 const result=await listTpoPlacementAnnouncements(context,tab.data,new Date(),page);
 const from42Unread=await countUnreadTpo42Announcements(context).catch(()=>null);
 const targetedReady=await placementTableExists("placement_tpo_notice_audiences")&&
  await placementTableExists("placement_tpo_notice_recipients");
 const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
 const noticeError=tpoNoticeFormErrorMessage(first(raw.noticeError));
 const sentId=first(raw.sentNotice);
 const sent=result.status==="READY"&&tab.data==="yours"&&sentId?
  result.items.find(row=>row.id===sentId&&row.senderUserId===context.user.id&&
    canUndoTpoAnnouncementSend(row.createdAt,new Date())):null;
 const query=tpoAudiencePreviewQuery.safeParse({
  audience:first(raw.audience)??"COLLEGE",
  targetId:first(raw.targetId)||undefined,
 });
 const formMinDateTime=new Date(new Date().getTime()+330*60_000).toISOString().slice(0,16);
 const targetOptions=result.status==="READY"&&tab.data==="yours"?
  await listTpoNoticeTargetOptions(context).catch(()=>null):null;
 const isPreview=result.status==="READY"&&tab.data==="yours";
 const selected=query.success?announcementPreviewScope(query.data):null;
 const previewRequest=isPreview&&query.success?
  (selected?previewTpoPlacementAudience(context,selected):
   previewTpoCollegeAnnouncementVisibility(context)):null;
 const preview=previewRequest?
  await previewRequest.then(value=>({value,failed:false as const}))
   .catch(()=>({value:null,failed:true as const})):
  {value:null,failed:false as const};
 const audience=preview.value;
 const retryPreviewHref=query.success?
  "/tpo/announcements?"+new URLSearchParams({
   tab:"yours",audience:query.data.audience,
   ...(query.data.targetId?{targetId:query.data.targetId}:{}),
  }).toString():"/tpo/announcements";
 return <main className="space-y-6">
  <PageHeader eyebrow="TPO · Communications" title="Announcements"
   description={tab.data==="from-42"?"What 42 tells placement cells.":
    "What you tell your students, to whom, and who has read it. They read it under Placements."}/>
  {first(raw.noticeSuccess)==="DELETED"?<p role="status" className="rounded-md border border-border bg-surface p-4 text-sm">Deleted. Its notices were taken back.</p>:null}
  {noticeError?<p role="alert" className="rounded-md border border-border bg-surface p-4 text-sm text-danger">{noticeError}</p>:null}
  {sent?<TpoNoticeUndoToast id={sent.id} version={sent.version} createdAt={sent.createdAt.toISOString()}/>:null}
  {result.status==="READY" && tab.data==="yours"?<TpoNoticeComposerDialog><section className="space-y-4">
   <h2 className="font-semibold text-foreground">Compose a college notice</h2>
   <p className="mt-1 text-sm text-body">Only active college members can see published notices; this form does not send email or SMS.</p>
   <form method="get" action="/tpo/announcements"
     className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-border p-3"
     aria-label="Announcement audience preview">
     <input type="hidden" name="tab" value="yours"/>
     <TpoNoticeAudiencePicker
      initialAudience={query.success?query.data.audience:"COLLEGE"}
      initialTarget={first(raw.targetId)??""} options={targetOptions}/>
     <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">Preview audience</button>
   </form>
   {!query.success?<p role="alert" className="mt-2 text-sm">Choose a valid audience and target ID.</p>:null}
   {preview.failed?<p role="alert" className="mt-3 rounded-lg border border-border p-3 text-sm">
     Could not check the audience right now. Your selection is unchanged.
     <Link href={retryPreviewHref} className="ml-2 font-semibold text-primary-text underline">Retry audience preview</Link>
    </p>:null}
   {audience?<div role="status" className="mt-3 rounded-lg border border-border p-3">
     <p className="text-sm font-semibold text-foreground">Current {query.success?query.data.audience.toLowerCase():"college"} visibility preview</p>
     <p className="mt-1 text-sm text-body">{selected?"Goes to "+audience.potentiallyVisibleMemberships+" students · "+(query.success?query.data.audience.toLowerCase().replaceAll("_"," "):"placements"):audience.potentiallyVisibleMemberships+" active college members could see this announcement."}</p>
     <p className="mt-1 text-xs text-muted-foreground">This is an estimate, not a send or delivery count. It excludes inactive memberships and disabled users. The selected audience determines recipient visibility when targeted storage is ready.</p>
   </div>:null}
   {query.success&&!canPublishTpoNoticeWithCurrentStorage(query.data.audience,targetedReady)?
    <p role="alert" className="mt-4 rounded-md border border-border p-3 text-sm">
      Targeted announcement publishing is not ready. This audience preview cannot be published
      until fixed recipient storage is registered. Choose COLLEGE only to publish to the whole college.
    </p>:null}
   <TpoNoticeDraftGuard formId="tpo-notice-create" actorId={context.user.id}/>
   <form id="tpo-notice-create" action="/api/placements/tpo/announcements" method="post" className="mt-4 space-y-3">
    <input type="hidden" name="audience" value={query.success?query.data.audience:"COLLEGE"}/>
    {query.success&&query.data.targetId?<input type="hidden" name="targetId" value={query.data.targetId}/>:null}
    <label className="grid gap-1 text-sm font-semibold">Title
     <input name="title" required maxLength={200} className="min-h-11 rounded-md border border-border bg-surface px-3" />
    </label>
    <label className="grid gap-1 text-sm font-semibold">Message
     <textarea name="message" required maxLength={8000} rows={5} className="rounded-md border border-border bg-surface p-3" />
    </label>
    <fieldset className="grid gap-2 rounded-md border border-border p-3">
     <legend className="text-sm font-semibold">Button (optional)</legend>
     <label className="grid gap-1 text-sm">Button label
      <input name="buttonLabel" maxLength={60} placeholder="Register"
       className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
     <label className="grid gap-1 text-sm">Button link
      <input name="buttonUrl" type="url" pattern="https://.*" maxLength={500}
       placeholder="https://forms.gle/…" title="The link has to start with https://"
       className="min-h-11 rounded-md border border-border bg-surface px-3"/>
     </label>
    </fieldset>
    <label className="grid gap-1 text-sm">Show until (IST, optional)
      <input type="datetime-local" name="showUntil" min={formMinDateTime} className="min-h-11 rounded-md border border-border bg-surface px-3"/>
    </label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> Pin this notice</label>
    <TpoNoticeScheduleControls minDateTime={formMinDateTime} count={audience?.potentiallyVisibleMemberships??null}
      enabled={Boolean(query.success&&audience&&audience.potentiallyVisibleMemberships>0&&
       canPublishTpoNoticeWithCurrentStorage(query.data.audience,targetedReady))}/>
   </form>
  </section></TpoNoticeComposerDialog>:null}
  <nav aria-label="Announcement tabs" className="flex flex-wrap gap-2">
   {([["yours","To your students"],["from-42","From 42"],["deleted","Recently removed"]] as const).map(([value,label])=><Link
    key={value} href={"/tpo/announcements?tab="+value} aria-current={value===tab.data?"page":undefined}
    className={value===tab.data?"inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm text-on-primary":
    "inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm text-body"}>{label}{value==="from-42"&&from42Unread!==null?` (${from42Unread})`:""}</Link>)}
  </nav>
  {result.status==="NOT_REGISTERED"?<section role="status" className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold text-foreground">Announcement storage pending</h2>
   <p className="mt-2 text-sm text-body">The announcements table has not been registered. No notices or audience counts are inferred from unrelated notifications.</p>
  </section>:result.items.length?<ol className="grid gap-3 md:grid-cols-2">
   {result.items.map(row=><li key={row.id} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <h2 className="break-words font-semibold text-foreground">{row.title}{row.isPinned?" · Pinned":""}
     {tab.data==="from-42"&&result.readStateReady&&!row.readAt?<span className="ml-2 rounded border border-border px-2 py-0.5 text-xs text-primary-text">New</span>:null}
    </h2>
    <p className="mt-1 text-xs text-muted-foreground">
      By {row.senderName?.trim()||"Placement team"} ·
      {" "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"}).format(row.createdAt)} IST
      {" · For "+({COLLEGE:"whole college",PLACEMENTS:"students in placements",BATCHES:"selected batches",BRANCHES:"selected branches",DRIVE:"selected drive"} as Record<string,string>)[row.audienceKind]}
      {row.updatedAt.getTime()>row.createdAt.getTime()+1000?" · Updated":""}
      {row.expiresAt?" · Shows until "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(row.expiresAt):""}
    </p>
    {tab.data==="yours" && row.scheduledAt && new Date(row.scheduledAt)>new Date()?
      <p role="status" className="mt-2 text-sm font-semibold text-amber-700">Scheduled for {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(row.scheduledAt))} IST</p>:
      tab.data==="yours"&&row.expiresAt&&new Date(row.expiresAt)<=new Date()?
      <p role="status" className="mt-2 text-sm font-semibold text-muted-foreground">Ended</p>:null}
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">
     {tpoNoticeTextParts(row.message).map((part,index)=>part.kind==="link"?
      <a key={index} href={part.value} target="_blank" rel="noopener noreferrer"
       className="font-semibold text-primary-text underline underline-offset-2">{part.value}</a>:
      <span key={index}>{part.value}</span>)}
    </p>
    {row.buttonUrl?.startsWith("https://")&&row.buttonLabel?<a href={row.buttonUrl}
      target="_blank" rel="noopener noreferrer"
      className="mt-3 inline-flex min-h-10 items-center rounded-md border border-border px-3 font-semibold text-primary-text">
      {row.buttonLabel} ↗
    </a>:null}
    {tab.data==="from-42"?<TpoPlacementCellReadAction id={row.id}/>:null}
    {tab.data==="yours"?<TpoNoticeReadProgress id={row.id}/>:null}
    {tab.data==="yours" ?
     <TpoNoticeComposerDialog mode="EDIT">
      <form method="post" action={"/api/placements/tpo/announcements/"+row.id+"/edit"} className="mt-3 grid gap-3">
       <input type="hidden" name="expectedVersion" value={row.version}/>
       <label className="grid gap-1 text-sm text-body">Title
        <input name="title" required maxLength={200} defaultValue={row.title}
         className="min-h-11 rounded-md border border-border bg-surface px-3"/>
       </label>
       <label className="grid gap-1 text-sm text-body">Message
        <textarea name="message" rows={5} required maxLength={8000} defaultValue={row.message}
         className="rounded-md border border-border bg-surface p-3"/>
       </label>
       <fieldset className="grid gap-2 rounded-md border border-border p-3">
        <legend className="text-sm font-semibold">Button (optional)</legend>
        <label className="grid gap-1 text-sm">Button label
         <input name="buttonLabel" maxLength={60} defaultValue={row.buttonLabel??""}
          className="min-h-10 rounded-md border border-border bg-surface px-3"/>
        </label>
        <label className="grid gap-1 text-sm">Button link
         <input name="buttonUrl" type="url" pattern="https://.*" maxLength={500}
          defaultValue={row.buttonUrl??""} title="The link has to start with https://"
          className="min-h-10 rounded-md border border-border bg-surface px-3"/>
        </label>
       </fieldset>
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
     </TpoNoticeComposerDialog>:null}
    {tab.data==="yours"?<TpoNoticeDeleteConfirm id={row.id} version={row.version}/>:null}
    {tab.data==="deleted"?
     <form method="post" action={"/api/placements/tpo/announcements/"+row.id+"/lifecycle"}
      className="mt-4 flex flex-wrap gap-2">
      <input type="hidden" name="expectedVersion" value={row.version}/>
      <input type="hidden" name="action" value={tab.data==="deleted"?"RESTORE":"DELETE"}/>
      <button type="submit" className="min-h-11 rounded-md border border-border px-4 text-sm text-primary-text">
       {tab.data==="deleted"?"Undo removal":"Remove notice"}
      </button>
     </form>:null}
    {tab.data==="yours"&&
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
  {result.status==="READY"?<nav aria-label="Announcement pages"
    className="flex flex-wrap items-center justify-between gap-3 text-sm">
   <span>Page {result.page}{result.hasMore?" · More announcements available":""}</span>
   <div className="flex gap-2">
    {result.page>1?<Link href={"/tpo/announcements?tab="+tab.data+"&page="+(result.page-1)}
      className="min-h-10 rounded-md border border-border px-4 py-2 text-primary-text">Previous</Link>:null}
    {result.hasMore?<Link href={"/tpo/announcements?tab="+tab.data+"&page="+(result.page+1)}
      className="min-h-10 rounded-md border border-border px-4 py-2 text-primary-text">Show older</Link>:null}
   </div>
  </nav>:null}
 </main>;
}
