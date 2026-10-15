import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {requirePermission} from "@/modules/permissions/policy";
import {listInboundMailForAdmin} from "@/modules/inbound-mail/admin-service";
import {inboundMailListQuerySchema} from "@/modules/inbound-mail/message-model";
import {InboundMailList} from "@/components/admin/inbound-mail-list";

type Params=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
export default async function InboundMailPage({searchParams}:{searchParams:Promise<Params>}) {
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const header=<PageHeader eyebrow="Super Admin" title="Inbound Mail" description="Private incoming messages. No automatic replies or outbound sends are performed."/>;
 if(context.adminScope?.organizationId||context.adminScope?.collegeId) return <div className="space-y-6">{header}
  <div role="status" className="rounded-xl border border-border bg-surface p-5">Switch to global Super Admin scope to inspect inbound messages. Incoming mail is not mapped to a verified college yet.</div></div>;
 const params=await searchParams;
 const parsed=inboundMailListQuerySchema.safeParse({status:one(params.status),q:one(params.q),recipient:params.recipient,page:one(params.page)});
 if(!parsed.success)return <div className="space-y-6">{header}
   <div role="alert" className="rounded-xl border border-border p-5">Invalid filters. <Link href="/admin/inbound-mail" className="font-semibold text-primary-text">Reset</Link></div></div>;
 const data=await listInboundMailForAdmin(context,parsed.data);
 if(!data.available)return <div className="space-y-6">{header}
  <div role="status" className="rounded-xl border border-border bg-surface p-5">
   Inbound mail storage has not been registered or deployed. The inbox is unavailable; this is not a zero-message result.
  </div></div>;
 const next=(page:number)=>{
  const url=new URLSearchParams();
  if(parsed.data.status!=="ALL")url.set("status",parsed.data.status);
  if(parsed.data.q)url.set("q",parsed.data.q);
  if(parsed.data.recipient)url.set("recipient",parsed.data.recipient);
  if(page>1)url.set("page",String(page));
  return "/admin/inbound-mail"+(url.size?"?"+url.toString():"");
 };
 return <div className="min-w-0 space-y-6">{header}
  <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
   <label className="min-w-0 flex-1 text-sm">Search
    <input name="q" defaultValue={parsed.data.q} maxLength={120} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border px-3" placeholder="Sender or subject"/></label>
   <label className="min-w-0 text-sm">Recipient inbox
    <input type="email" name="recipient" defaultValue={parsed.data.recipient??""} maxLength={320} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border px-3" placeholder="inbox@example.edu"/></label>
   <label className="text-sm">Status
    <select name="status" defaultValue={parsed.data.status} className="mt-1 min-h-11 w-full rounded-md border border-border px-3">
     <option value="ALL">All</option><option value="NEW">New</option><option value="TRIAGED">Triaged</option><option value="RESOLVED">Resolved</option>
    </select></label>
   <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
   <Link href="/admin/inbound-mail" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm">Clear</Link>
  </form>
  <InboundMailList rows={data.items.map(x=>({
   id:x.id,receivedAt:x.receivedAt.toISOString(),fromAddress:x.fromAddress,
   toAddress:x.toAddress,subject:x.subject,bodyPlain:x.bodyPlain,status:x.status,
  }))}/>
  <nav aria-label="Inbox pages" className="flex flex-wrap justify-between gap-3 text-sm">
   <span>Page {data.page}</span><div className="flex flex-wrap gap-3">
   {data.page>1?<Link className="inline-flex min-h-10 items-center rounded-md border px-3" href={next(data.page-1)}>Previous</Link>:null}
   {data.hasMore?<Link className="inline-flex min-h-10 items-center rounded-md border px-3" href={next(data.page+1)}>Next</Link>:null}
   </div>
  </nav>
 </div>;
}
