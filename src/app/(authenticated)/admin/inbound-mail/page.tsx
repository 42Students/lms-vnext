import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {requirePermission} from "@/modules/permissions/policy";
import {listInboundMailForAdmin} from "@/modules/inbound-mail/admin-service";
import {inboundMailListQuerySchema} from "@/modules/inbound-mail/message-model";
import {InboundMailList} from "@/components/admin/inbound-mail-list";

type Params=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>typeof value==="string"?value:undefined;
export default async function InboundMailPage({searchParams}:{searchParams:Promise<Params>}) {
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const header=<PageHeader eyebrow="Super Admin" title="Inbound mail" description="Private incoming messages. No automatic replies or outbound sends are performed."/>;
 const params=await searchParams;
 // Duplicate/repeated query keys are ambiguous across proxies and URLs.
 // Reject them instead of choosing a different filter value by render order.
 const repeated=["status","q","recipient","page"].some(key=>
   Array.isArray(params[key]));
 const parsed=inboundMailListQuerySchema.safeParse({status:one(params.status)??"NEW",q:one(params.q),recipient:one(params.recipient),page:one(params.page)});
 if(repeated||!parsed.success)return <div className="space-y-6">{header}
   <div role="alert" className="rounded-xl border border-border p-5">Invalid filters. <Link href="/admin/inbound-mail" className="font-semibold text-[var(--lms-teal-deep)]">Reset</Link></div></div>;
 const data=await listInboundMailForAdmin(context,parsed.data);
 if(!data.available)return <div className="space-y-6">{header}
  <div role="status" className="space-y-3 rounded-xl border border-border bg-surface p-4 sm:p-6">
   <p>Inbound mail storage has not been registered or deployed. The inbox is unavailable; this is not a zero-message result.</p>
   <Link href="/admin/inbound-mail" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline">Retry</Link>
  </div></div>;
 const totalPages=data.total===null?null:Math.max(1,Math.ceil(data.total/50));
 const pageNumbers=totalPages===null?[]:Array.from(
  {length:Math.min(totalPages,7)},(_,i)=>Math.max(1,Math.min(data.page-3,totalPages-6))+i);
 const next=(page:number)=>{
  const url=new URLSearchParams();
  if(parsed.data.status!=="ALL")url.set("status",parsed.data.status);
  if(parsed.data.q)url.set("q",parsed.data.q);
  if(parsed.data.recipient)url.set("recipient",parsed.data.recipient);
  if(page>1)url.set("page",String(page));
  return "/admin/inbound-mail"+(url.size?"?"+url.toString():"");
 };
 const base=new URLSearchParams({...parsed.data.q?{q:parsed.data.q}:{},...parsed.data.recipient?{recipient:parsed.data.recipient}:{}});
 const tabs=[{value:"NEW",label:"To read",count:data.toReadCount},{value:"TRIAGED",label:"Being handled",count:null},
  {value:"RESOLVED",label:"Done",count:null},{value:"ALL",label:"All",count:null}] as const;
 return <div className="min-w-0 space-y-6">{header}
  <nav aria-label="Inbound mail views" className="flex flex-wrap gap-2">{tabs.map(tab=>{
   const url=new URLSearchParams(base);url.set("status",tab.value);
   return <Link key={tab.value} href={"/admin/inbound-mail?"+url.toString()} aria-current={parsed.data.status===tab.value?"page":undefined}
    className={parsed.data.status===tab.value?"min-h-11 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-foreground":"min-h-11 rounded-md border border-border px-4 py-3 text-sm font-semibold text-[var(--lms-teal-deep)]"}>
    {tab.label}{tab.count!==null&&tab.count!==undefined?" ("+tab.count+")":""}
   </Link>})}</nav>
  <form method="get" className="flex min-w-0 flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
   <label className="min-w-0 flex-1 text-sm">Search
    <Input name="q" defaultValue={parsed.data.q} maxLength={120} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border px-3" placeholder="Sender, subject or message body"/></label>
   <label className="min-w-0 flex-1 basis-48 text-sm">Recipient inbox
    <Input type="email" name="recipient" defaultValue={parsed.data.recipient??""} maxLength={320} className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-border px-3" placeholder="inbox@example.edu"/></label>
   <label className="text-sm">Status
    <Select name="status" defaultValue={parsed.data.status} className="mt-1 min-h-11 w-full rounded-md border border-border px-3">
     <option value="ALL">All</option><option value="NEW">To read</option><option value="TRIAGED">Being handled</option><option value="RESOLVED">Done</option>
    </Select></label>
   <Button type="submit">Filter</Button>
   <Link href="/admin/inbound-mail?status=NEW" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm">Clear</Link>
  </form>
  <InboundMailList rows={data.items.map(x=>({
   id:x.id,receivedAt:x.receivedAt.toISOString(),fromAddress:x.fromAddress,
   toAddress:x.toAddress,subject:x.subject,bodyPlain:x.bodyPlain,status:x.status,version:x.version,
  }))}/>
  <nav aria-label="Inbox pages" className="flex flex-wrap justify-between gap-3 text-sm">
   <span>{data.total===null?"Page "+data.page:data.total+" matching messages · Page "+data.page+" of "+totalPages}</span><div className="flex flex-wrap gap-3">
   {pageNumbers.map(n=><Link key={n} href={next(n)} aria-current={n===data.page?"page":undefined}
     className={n===data.page?"inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-primary bg-primary-subtle px-3 py-2 text-[var(--lms-teal-deep)]":"inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-border px-3 py-2"}>{n}</Link>)}
   {data.page>1?<Link className="inline-flex min-h-11 items-center rounded-md border px-3" href={next(data.page-1)}>Previous</Link>:null}
   {data.hasMore?<Link className="inline-flex min-h-11 items-center rounded-md border px-3" href={next(data.page+1)}>Next</Link>:null}
   </div>
  </nav>
 </div>;
}
