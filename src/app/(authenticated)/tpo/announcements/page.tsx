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
   description="Read-only placement notices explicitly addressed to this college. Draft, remind and undo actions require separately registered delivery controls."/>
  <nav aria-label="Announcement tabs" className="flex flex-wrap gap-2">
   {([["yours","Yours"],["from-42","From 42"]] as const).map(([value,label])=><Link
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
    <p className="mt-3 text-xs text-muted-foreground">
     {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(row.createdAt)} IST</p>
   </li>)}
  </ol>:<p role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
   No currently visible college-wide announcements from this sender.</p>}
 </main>;
}
