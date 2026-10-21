import { DateInput } from "@/components/ui/date-input";
import { Tabs } from "@/components/ui/tabs";
import {StatusBadge} from "@/components/ui/status-badge";
import {TpoNoticeMessageCount} from "@/components/tpo/tpo-notice-message-count";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
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
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import {EmptyState} from "@/components/ui/empty-state";
import {hasMembershipRole} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePersistedTpoMembership} from "@/modules/placements/tpo-persisted-actor-service";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {listTpoPlacementAnnouncements,countUnreadTpo42Announcements} from "@/modules/announcements/tpo-placement-read-service";
import {tpoAudiencePreviewQuery} from "@/modules/announcements/tpo-audience-preview-query";
import {TpoNoticeLiveAudienceProvider,TpoNoticeLiveReach,TpoNoticeLiveSubmitControls} from "@/components/tpo/tpo-notice-live-preview";
import {tpoAnnouncementTabSchema} from "@/modules/announcements/tpo-placement-read-model";
type Props={searchParams:Promise<{tab?:string|string[];audience?:string|string[];targetId?:string|string[];targetIds?:string|string[];noticeError?:string|string[];sentNotice?:string|string[];page?:string|string[];mine?:string|string[];noticeSuccess?:string|string[]}>};

// A scheduled notice is not sent when it is drafted. The effective publish
// clock starts no earlier than scheduledAt; delayed worker delivery can only
// shorten the remaining Undo window, never extend it past the old rule.
function noticeUndoAnchor(row:{createdAt:Date;scheduledAt:Date|null}):Date {
 return row.scheduledAt&&row.scheduledAt>row.createdAt?row.scheduledAt:row.createdAt;
}
export default async function TpoAnnouncements({searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 await requirePersistedTpoMembership(context,context.membership.collegeId);
 const raw=await searchParams;
 const scalarKeys=["tab","page","mine","audience","targetId"] as const;
 if(scalarKeys.some(key=>Array.isArray(raw[key])))
  return <div className="min-w-0 space-y-4"><PageHeader title="Announcements"/><Alert tone="error">Invalid announcement filters. <Link href="/tpo/announcements">Return to announcements</Link></Alert></div>;
 const t=Array.isArray(raw.tab)?raw.tab[0]:raw.tab;
 const legacyTab=t==="from42"?"from-42":t==="students"?"yours":t;
 const tab=tpoAnnouncementTabSchema.safeParse(legacyTab??"yours");
 if(!tab.success)return <div className="min-w-0 space-y-4"><PageHeader title="Announcements"/><Alert tone="error">Invalid tab. <Link href="/tpo/announcements">Return to announcements</Link></Alert></div>;
 const pageValue=Array.isArray(raw.page)?raw.page[0]:raw.page;
 const page=pageValue&&/^[1-9][0-9]{0,3}$/.test(pageValue)?Math.min(1000,Number(pageValue)):1;
 const showTeam=Array.isArray(raw.mine)?raw.mine[0]==="0":raw.mine==="0";
 const result=await listTpoPlacementAnnouncements(context,tab.data,new Date(),page,showTeam?"COLLEGE":"MINE")
  .catch((error:unknown)=>{
   if(error instanceof AuthorizationError)throw error;
   return {status:"FAILED" as const,items:[]};
  });
 const from42Unread=await countUnreadTpo42Announcements(context).catch(()=>null);
 const targetedReady=await placementTableExists("placement_tpo_notice_audiences")&&
  await placementTableExists("placement_tpo_notice_recipients");
 const first=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
 const noticeError=tpoNoticeFormErrorMessage(first(raw.noticeError));
 const sentId=first(raw.sentNotice);
 const sent=result.status==="READY"&&tab.data==="yours"&&sentId?
  result.items.find(row=>row.id===sentId&&row.senderUserId===context.user.id&&
    canUndoTpoAnnouncementSend(noticeUndoAnchor(row),new Date())):null;
 const query=tpoAudiencePreviewQuery.safeParse({
  audience:first(raw.audience)??"PLACEMENTS",
  targetId:first(raw.targetId)||undefined,
  targetIds:raw.targetIds?(Array.isArray(raw.targetIds)?raw.targetIds:[raw.targetIds]):undefined,
 });
 const formMinDateTime=new Date(new Date().getTime()+330*60_000).toISOString().slice(0,16);
 const targetOptions=result.status==="READY"&&tab.data==="yours"?
  await listTpoNoticeTargetOptions(context).catch(()=>null):null;
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Announcements"
   description={tab.data==="from-42"?"What 42 tells placement cells.":
    "What you tell your students, to whom, and who has read it. They read it under Placements."}
   actions={result.status==="READY" && tab.data==="yours"?
    <TpoNoticeComposerDialog initialOpen={Boolean(first(raw.audience)||first(raw.targetId)||raw.targetIds)}><section aria-labelledby="section-compose-a-college-notice" className="space-y-4">
   <h2 id="section-compose-a-college-notice" className="sr-only">Compose a college notice</h2>
   <p className="mt-1 text-sm text-body">Only active college members can see published notices. Email is unavailable (emailReady: false); no email or SMS is sent.</p>
   <TpoNoticeLiveAudienceProvider formId="tpo-notice-create">
   <TpoNoticeDraftGuard formId="tpo-notice-create" actorId={context.user.id}/>
   <form id="tpo-notice-create" action="/api/placements/tpo/announcements" method="post" className="mt-4 min-w-0 space-y-4">
    <TpoNoticeAudiencePicker
      initialAudience={query.success?query.data.audience:"PLACEMENTS"}
      initialTarget={first(raw.targetId)??""}
      initialTargets={query.success?query.data.targetIds??[]:[]} options={targetOptions}/>
    <TpoNoticeLiveReach targetedReady={targetedReady}/>
    <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
     <Input name="title" required maxLength={200} placeholder="Omega pre-placement talk on Monday"
      className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]" />
    </label>
    <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Announcement
     <Textarea name="message" required maxLength={8000} rows={5}
      placeholder="What, when, where, and what they should do. Links starting with https:// become clickable."
      aria-describedby="tpo-notice-create-count" />
    </label>
    <TpoNoticeMessageCount formId="tpo-notice-create" outputId="tpo-notice-create-count"/>
    <details open className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-3">
     <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-[var(--lms-body-text)] md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Button (optional)</summary>
     <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[36%_minmax(0,1fr)]">
     <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Button label
      <Input name="buttonLabel" maxLength={60} placeholder="Register"
       className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
     </label>
     <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Button link
      <Input name="buttonUrl" type="url" pattern="https://.*" maxLength={500}
       placeholder="https://forms.gle/…" title="The link has to start with https://"
       className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
     </label>
     </div>
    </details>
    <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Show until (IST, optional)
      <DateInput mode="datetime-local" name="showUntil" min={formMinDateTime} className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
    </label>
    <p className="text-xs text-muted-foreground">After this, students no longer see it. You still do.</p>
    <label className="flex items-center gap-2 text-[var(--lms-font-sm)] font-semibold leading-4"><Checkbox name="pinned" /> Pin it to the top</label>
    <p className="text-xs text-muted-foreground">Students get a notice in the app. You can undo for 30 seconds after sending. Email and SMS are unavailable.</p>
    <TpoNoticeLiveSubmitControls minDateTime={formMinDateTime} targetedReady={targetedReady}/>
   </form>
   </TpoNoticeLiveAudienceProvider>
  </section></TpoNoticeComposerDialog>:null}/>
  {first(raw.noticeSuccess)==="DELETED"?<InlineNotice tone="success" message="Deleted. Its notices were taken back."/>:null}
  {first(raw.noticeSuccess)==="SAVED"?<InlineNotice tone="success" message="Saved"/>:null}
  {first(raw.noticeSuccess)==="SCHEDULED"?<InlineNotice tone="success" message="Scheduled"/>:null}
  {noticeError?<InlineNotice tone="error" message={noticeError}/>:null}
  {sent?<TpoNoticeUndoToast id={sent.id} version={sent.version} createdAt={noticeUndoAnchor(sent).toISOString()}/>:null}
  <Tabs ariaLabel="Announcement tabs" renderPanel={false} value={tab.data} items={([
    ["yours","To your students"],["from-42","From 42"],["deleted","Recently removed"]
  ] as const).map(([value,label])=>({
    value,label:value==="from-42"&&from42Unread!==null&&from42Unread>0&&tab.data!=="from-42"?label+" ("+from42Unread+")":label,
    href:"/tpo/announcements?tab="+value,
  }))}/>
  {tab.data!=="from-42"?<nav aria-label="Announcement author scope"
    className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
    <Link href={"/tpo/announcements?tab="+tab.data} aria-current={!showTeam?"page":undefined}
      className={"inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border px-3 text-[13px] font-semibold md:min-h-[var(--lms-control-height)] "+(!showTeam?
        "border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]":
        "border-[var(--lms-canvas-border)] bg-surface text-[var(--lms-body-text)] hover:border-[var(--lms-primary)]")}>Your notices</Link>
    <Link href={"/tpo/announcements?tab="+tab.data+"&mine=0"} aria-current={showTeam?"page":undefined}
      className={"inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border px-3 text-[13px] font-semibold md:min-h-[var(--lms-control-height)] "+(showTeam?
        "border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] text-[var(--lms-primary-text)]":
        "border-[var(--lms-canvas-border)] bg-surface text-[var(--lms-body-text)] hover:border-[var(--lms-primary)]")}>All team notices</Link>
   </nav>:null}
  {result.status==="FAILED"?<Alert tone="error">
   <h2 className="font-semibold text-foreground">Couldn't load announcements</h2>
   <p className="mt-2 text-sm text-body">Announcements could not be loaded. Your filters are unchanged.</p>
   <Link href={"/tpo/announcements?"+new URLSearchParams({tab:tab.data,page:String(page),...(showTeam?{mine:"0"}:{})}).toString()}
    className="mt-2 inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline md:min-h-9">Retry</Link>
  </Alert>:result.status==="NOT_REGISTERED"?<Alert tone="warning">
   <h2 className="font-semibold text-foreground">Announcement storage pending</h2>
   <p className="mt-2 text-sm text-body">The announcements table has not been registered. No notices or audience counts are inferred from unrelated notifications.</p>
  </Alert>:result.items.length?<ol aria-label="tpo announcements entries" className="min-w-0 space-y-3">
   {result.items.map(row=><li key={row.id} id={"announcement-"+row.id}
    className={"min-w-0 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-5 "+(row.isPinned?"border-l-[3px] border-l-[var(--lms-primary)] ":"")+(row.expiresAt&&new Date(row.expiresAt)<=new Date()?"opacity-75":"")}>
    <div className="flex min-w-0 flex-wrap items-center gap-2">
     {row.isPinned?<svg role="img" aria-label="Pinned" viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="shrink-0 text-primary-text">
      <path d="M15.7 3.3a1 1 0 0 0-1.4 0l-.8.8 1.5 1.5-3.1 3.1-4.2-.4-1.6 1.6 3.4 3.4-5.8 5.8 1.4 1.4 5.8-5.8 3.4 3.4 1.6-1.6-.4-4.2 3.1-3.1 1.5 1.5.8-.8a1 1 0 0 0 0-1.4z"/>
     </svg>:null}
     <h2 className="m-0 min-w-0 break-words text-[var(--lms-font-xl)] font-semibold leading-[30px] text-[var(--lms-heading)] md:text-[22px] md:leading-[32px]">{row.title}</h2>
     {tab.data==="from-42"&&result.readStateReady&&!row.readAt?<StatusBadge tone="info">New</StatusBadge>:null}
     {tab.data==="yours"&&row.scheduledAt&&new Date(row.scheduledAt)>new Date()?<StatusBadge tone="warning">Scheduled for {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"}).format(new Date(row.scheduledAt))} IST</StatusBadge>:null}
     {row.expiresAt&&new Date(row.expiresAt)<=new Date()?<StatusBadge tone="neutral">Ended</StatusBadge>:null}
     {row.updatedAt.getTime()>row.createdAt.getTime()+1000?<StatusBadge tone="neutral">Updated</StatusBadge>:null}
    </div>
    <p className="mt-1 text-xs text-muted-foreground leading-5">
      By {row.senderName?.trim()||"Placement team"} ·
      {" "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"}).format(row.createdAt)} IST
      {" · For "+({COLLEGE:"whole college",PLACEMENTS:"students in placements",BATCHES:"selected batches",BRANCHES:"selected branches",DRIVE:"selected drive"} as Record<string,string>)[row.audienceKind]}
      {row.expiresAt&&new Date(row.expiresAt)>new Date()?" · shows until "+new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(row.expiresAt):""}
    </p>
    <p className="mt-3 max-w-[72ch] whitespace-pre-wrap break-words text-sm text-body leading-[22px]">
     {tpoNoticeTextParts(row.message).map((part,index)=>part.kind==="link"?
      <a key={index} href={part.value} rel="noopener noreferrer"
       className="font-semibold text-[var(--lms-link-text)] underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">{part.value}</a>:
      <span key={index}>{part.value}</span>)}
    </p>
    {(row.buttonUrl?.startsWith("https://")&&row.buttonLabel)||tab.data==="from-42"?
     <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
      {row.buttonUrl?.startsWith("https://")&&row.buttonLabel?<a href={row.buttonUrl} rel="noopener noreferrer"
       className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-3 font-[650] text-[var(--lms-link-text)] min-[768px]:min-h-[var(--lms-control-height)] md:min-h-9 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] hover:underline">
       {row.buttonLabel} ↗
      </a>:null}
      {tab.data==="from-42"?<TpoPlacementCellReadAction id={row.id}/>:null}
     </div>:null}
    {tab.data!=="from-42"?<div className="mt-4 flex min-w-0 flex-wrap items-center gap-2">
    {tab.data==="yours" ?
     <TpoNoticeComposerDialog mode="EDIT">
      <form id={"tpo-notice-edit-"+row.id} method="post" action={"/api/placements/tpo/announcements/"+row.id+"/edit"} className="grid min-w-0 gap-4">
       <Input type="hidden" name="expectedVersion" value={row.version}/>
       <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
        <Input name="title" required maxLength={200} defaultValue={row.title}
         placeholder="Omega pre-placement talk on Monday"
         className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
       </label>
       <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Announcement
        <Textarea name="message" rows={5} required maxLength={8000} defaultValue={row.message}
         placeholder="What, when, where, and what they should do. Links starting with https:// become clickable."
         aria-describedby={"tpo-notice-edit-"+row.id+"-count"}/>
       </label>
       <TpoNoticeMessageCount formId={"tpo-notice-edit-"+row.id} outputId={"tpo-notice-edit-"+row.id+"-count"}/>
       <details open className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-3">
        <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-[var(--lms-body-text)] md:min-h-[var(--lms-control-height)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Button (optional)</summary>
        <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-[36%_minmax(0,1fr)]">
        <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Button label
         <Input name="buttonLabel" maxLength={60} defaultValue={row.buttonLabel??""}
          className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
        </label>
        <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Button link
         <Input name="buttonUrl" type="url" pattern="https://.*" maxLength={500}
          defaultValue={row.buttonUrl??""} title="The link has to start with https://"
          className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
        </label>
        </div>
       </details>
       <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Send at (IST)
        <DateInput mode="datetime-local" name="sendAt"
         defaultValue={row.scheduledAt?new Date(new Date(row.scheduledAt).getTime()+330*60000).toISOString().slice(0,16):""}
         className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
       </label>
       <label className="grid gap-2 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Show until (IST)
        <DateInput mode="datetime-local" name="showUntil"
         defaultValue={row.expiresAt?new Date(new Date(row.expiresAt).getTime()+330*60000).toISOString().slice(0,16):""}
         className="min-h-11 min-[768px]:min-h-[var(--lms-control-height)]"/>
       </label>
       <p className="text-xs text-muted-foreground">After this, students no longer see it. You still do.</p>
       <label className="flex items-center gap-2 text-[var(--lms-font-sm)] text-[var(--lms-neutral-400)] font-semibold leading-4">
        <Checkbox name="pinned" defaultChecked={row.isPinned}/> Pin it to the top
       </label>
       <label className="flex items-start gap-2 text-[var(--lms-font-sm)] text-[var(--lms-neutral-400)] font-semibold leading-4">
        <Checkbox name="notifyChanged" className="mt-1"/>
        <span>Tell them it changed (a short notice to the same students)
         <span className="block text-xs text-muted-foreground">Notify only people who received the original announcement. Leave unchecked to edit without another notification.</span>
        </span>
       </label>
       {targetedReady&&targetOptions&&row.scheduledAt&&
        new Date(row.scheduledAt).getTime()>Date.now()?<fieldset
         className="grid gap-2 rounded-[var(--lms-control-radius)] border border-border p-3">
         <legend className="text-sm font-semibold">Change audience (before sending)</legend>
         <label className="flex items-center gap-2 text-[var(--lms-font-sm)] font-semibold leading-4">
          <Checkbox name="changeAudience"/> Change audience for this scheduled notice
         </label>
         <p className="text-xs text-muted-foreground leading-5">
          Select the box only to replace the saved audience. Choose the new audience below;
          the new recipients are selected when you save. The old audience is retained if
          the box is unchecked.
         </p>
         <TpoNoticeAudiencePicker initialAudience="COLLEGE" initialTarget=""
          initialTargets={[]} options={targetOptions}/>
        </fieldset>:null}
       <p className="text-xs text-muted-foreground leading-5">Save fails if the notice changed since this page was loaded.</p>
       <Button type="submit" className="min-h-11 md:min-h-9">Save notice edits</Button>
      </form>
     </TpoNoticeComposerDialog>:null}
    {tab.data==="yours"?<TpoNoticeDeleteConfirm id={row.id} version={row.version}/>:null}
    {tab.data==="deleted"?
     <form method="post" action={"/api/placements/tpo/announcements/"+row.id+"/lifecycle"}
      className="flex min-w-0 flex-wrap items-center gap-2">
      <Input type="hidden" name="expectedVersion" value={row.version}/>
      <Input type="hidden" name="action" value={tab.data==="deleted"?"RESTORE":"DELETE"}/>
      <Button variant="secondary" type="submit" className="min-h-11 md:min-h-9">
       {tab.data==="deleted"?"Undo removal":"Remove notice"}
      </Button>
     </form>:null}
    {tab.data==="yours"&&
     canUndoTpoAnnouncementSend(noticeUndoAnchor(row),new Date())?
     <form method="post" action={"/api/placements/tpo/announcements/"+row.id+"/lifecycle"}
      className="min-w-0">
      <Input type="hidden" name="expectedVersion" value={row.version}/>
      <Input type="hidden" name="action" value="UNDO_SEND"/>
      <Button variant="secondary" type="submit" className="min-h-11 md:min-h-9">
       Undo send (30 seconds)
      </Button>
     </form>:null}
    </div>:null}
    {tab.data==="yours"?<TpoNoticeReadProgress id={row.id}
      status={row.scheduledAt&&new Date(row.scheduledAt)>new Date()?"SCHEDULED":
       row.expiresAt&&new Date(row.expiresAt)<=new Date()?"ENDED":"SENT"}/>:null}
   </li>)}
  </ol>:<EmptyState title={tab.data==="from-42"?"Nothing from 42 yet.":tab.data==="yours"?"Nothing yet. Tell students about a talk, a deadline or a change; pick who it is for, and see who has read it.":"No recently removed announcements."}/>}
  {result.status==="READY"&&(result.page>1||result.hasMore)?<nav aria-label="Announcement pages"
    className="flex min-w-0 flex-col items-stretch gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
   <span>Page {result.page}{result.hasMore?" · More announcements available":""}</span>
   <div className="flex w-full flex-wrap gap-2 sm:w-auto">
    {result.page>1?<Link href={"/tpo/announcements?tab="+tab.data+(showTeam?"&mine=0":"")+"&page="+(result.page-1)}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 text-[var(--lms-link-text)] hover:text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] sm:min-h-[var(--lms-control-height)] sm:flex-none md:min-h-9 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] hover:underline">Previous</Link>:null}
    {result.hasMore?<Link href={"/tpo/announcements?tab="+tab.data+(showTeam?"&mine=0":"")+"&page="+(result.page+1)}
      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] px-4 text-[var(--lms-link-text)] hover:text-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)] sm:min-h-[var(--lms-control-height)] sm:flex-none md:min-h-9 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] hover:underline">Show older</Link>:null}
   </div>
  </nav>:null}
 </div>;
}
