import Link from "next/link";
import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {hasMembershipRole} from "@/modules/identity/context";
import {listTpoPlacementAnnouncements} from "@/modules/announcements/tpo-placement-read-service";
import {tpoAnnouncementTabSchema} from "@/modules/announcements/tpo-placement-read-model";
type Props={searchParams:Promise<{tab?:string|string[]}>};
export default async function TpoAnnouncements({searchParams}:Props){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasMembershipRole(context,"TPO"))redirect("/dashboard");
 const raw=await searchParams;
 const t=Array.isArray(raw.tab)?raw.tab[0]:raw.tab;
 const tab=tpoAnnouncementTabSchema.safeParse(t??"yours");
 if(!tab.success)return <main role="alert" className="p-5">Invalid tab. <Link href="/tpo/announcements">Return to announcements</Link></main>;
 const result=await listTpoPlacementAnnouncements(context,tab.data);
 return <main className="space-y-6">
  <PageHeader eyebrow="TPO · Communications" title="Announcements"
   description="College-wide notices for this college. Removal and undo are author-only and version checked; external reminders remain unavailable."/>
  {result.status==="READY" && tab.data==="yours"?<section className="rounded-xl border border-border bg-surface p-5">
   <h2 className="font-semibold text-foreground">Compose a college notice</h2>
   <p className="mt-1 text-sm text-body">Only active college members can see published notices; this form does not send email or SMS.</p>
   <form action="/api/placements/tpo/announcements" method="post" className="mt-4 space-y-3">
    <label className="grid gap-1 text-sm font-semibold">Title
     <input name="title" required maxLength={255} className="min-h-11 rounded-md border border-border bg-surface px-3" />
    </label>
    <label className="grid gap-1 text-sm font-semibold">Message
     <textarea name="message" required maxLength={10000} rows={5} className="rounded-md border border-border bg-surface p-3" />
    </label>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="pinned" /> Pin this notice</label>
    <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Publish college notice</button>
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
    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{row.message}</p>
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
    <p className="mt-3 text-xs text-muted-foreground">
     {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(row.createdAt)} IST</p>
   </li>)}
  </ol>:<p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
   No currently visible college-wide announcements from this sender.</p>}
 </main>;
}
