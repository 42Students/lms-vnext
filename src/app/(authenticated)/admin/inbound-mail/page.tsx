import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Tabs} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
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
 if(repeated||!parsed.success)return <div className="min-w-0 space-y-4 md:space-y-6">{header}
   <Alert tone="warning">Invalid filters. <Link href="/admin/inbound-mail" className="inline-flex items-center min-h-11 md:min-h-9 lms-inline-link font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)]">Reset</Link></Alert></div>;
 const data=await listInboundMailForAdmin(context,parsed.data);
 if(!data.available)return <div className="min-w-0 space-y-4 md:space-y-6">{header}
  <Alert tone="warning">
   <p>Inbound mail storage has not been registered or deployed. The inbox is unavailable; this is not a zero-message result.</p>
   <Link href="/admin/inbound-mail" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] underline-offset-4">Retry</Link>
  </Alert></div>;
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
 return <div className="min-w-0 space-y-4 md:space-y-6">{header}
  <Tabs ariaLabel="Inbound mail views" value={parsed.data.status} renderPanel={false}
    items={tabs.map(tab=>{
     const url=new URLSearchParams(base);url.set("status",tab.value);
     return {value:tab.value,label:tab.label,
      count:tab.count===null?undefined:tab.count,
      href:"/admin/inbound-mail?"+url.toString()};
    })}/>
  <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] min-[768px]:grid-cols-[minmax(0,1fr)_auto_auto]">
   <label className="min-w-0 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
    <Input name="q" defaultValue={parsed.data.q} maxLength={120} className="mt-1 min-w-0" placeholder="Sender, subject or message body"/></label>
   <Button type="submit" className="w-full min-[768px]:w-auto">Filter</Button>
   {data.items.length>0?<Link href="/admin/inbound-mail?status=NEW" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white min-[768px]:min-h-9 min-[768px]:w-auto">Clear</Link>:null}
   <details className="min-w-0 min-[768px]:col-span-3" open={Boolean(parsed.data.recipient)}>
    <summary className="inline-flex min-h-11 cursor-pointer items-center text-[var(--lms-font-sm)] font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Recipient inbox · Status</summary>
    <div className="grid min-w-0 gap-[var(--lms-space-3)] pt-[var(--lms-space-3)] min-[768px]:grid-cols-2">
     <label className="min-w-0 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recipient inbox
      <Input type="email" name="recipient" defaultValue={parsed.data.recipient??""} maxLength={320} className="mt-1 min-w-0" placeholder="inbox@example.edu"/></label>
     <label className="min-w-0 text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
      <Select name="status" defaultValue={parsed.data.status} className="mt-1 w-full">
       <option value="ALL">All</option><option value="NEW">To read</option><option value="TRIAGED">Being handled</option><option value="RESOLVED">Done</option>
      </Select></label>
    </div>
   </details>
  </form>
  <InboundMailList rows={data.items.map(x=>({
   id:x.id,receivedAt:x.receivedAt.toISOString(),fromAddress:x.fromAddress,
   toAddress:x.toAddress,subject:x.subject,bodyPlain:x.bodyPlain,status:x.status,version:x.version,
  }))}/>
  <nav aria-label="Inbox pages" className="flex min-w-0 flex-col gap-[var(--lms-space-3)] text-sm min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
   <span className="min-w-0 text-body">{data.total===null?"Page "+data.page:data.total+" matching messages · Page "+data.page+" of "+totalPages}</span>
   <div className="flex w-full min-w-0 items-center gap-[var(--lms-space-2)] min-[768px]:w-auto">
    {data.page>1?<Link className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white font-[650] min-[768px]:min-h-9" href={next(data.page-1)}>Previous</Link>:null}
    <div className="flex min-w-0 flex-1 items-center gap-[var(--lms-space-2)] overflow-x-auto pb-1 min-[768px]:flex-none min-[768px]:overflow-visible min-[768px]:pb-0">
     {pageNumbers.map(n=><Link key={n} href={next(n)} aria-current={n===data.page?"page":undefined}
       className={n===data.page?"inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary-subtle px-3 py-2 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:min-w-9":"inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9 min-[768px]:min-w-9"}>{n}</Link>)}
    </div>
    {data.hasMore?<Link className="inline-flex min-h-11 shrink-0 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white font-[650] min-[768px]:min-h-9" href={next(data.page+1)}>Next</Link>:null}
   </div>
  </nav>
 </div>;
}
