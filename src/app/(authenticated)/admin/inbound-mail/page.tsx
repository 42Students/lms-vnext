import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Tabs} from "@/components/ui/tabs";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {requirePermission} from "@/modules/permissions/policy";
import {listInboundMailForAdmin, INBOUND_ROUTING_METADATA_READY} from "@/modules/inbound-mail/admin-service";
import {inboundMailListQuerySchema} from "@/modules/inbound-mail/message-model";
import {InboundMailList} from "@/components/admin/inbound-mail-list";
import { Label } from "@/components/ui/label";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";

type Params=Record<string,string|string[]|undefined>;
const one=(value:string|string[]|undefined)=>typeof value==="string"?value:undefined;
const optional=(value:string|string[]|undefined)=>one(value)?.trim()||undefined;
export default async function InboundMailPage({searchParams}:{searchParams:Promise<Params>}) {
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const header=<header className="space-y-2">
   <PageHeader title="Inbound mail"/>
   <p className="max-w-4xl text-sm text-body">
     Every email sent to a 42lms.com address. Recruiters&apos; replies to a conversation go straight into it; anything else waits here until someone reads it and marks it done.
   </p>
   <p className="text-xs text-muted-foreground">Private platform-wide inbox. Failed recruiter replies remain available for manual triage; this view never sends automatic replies.</p>
 </header>;
 const params=await searchParams;
 // Inbox payloads may contain messages addressed to other organizations.
 // The persisted vNext inbox contract is deliberately global-only.
 if(context.adminScope?.collegeId||context.adminScope?.organizationId)
  return <div className="min-w-0 space-y-4 md:space-y-6">{header}
    <Alert tone="warning">
      Inbound mail is available only in the global Super Admin scope.
      Clear the organization and college selection in the header to continue.
      No other college's private incoming messages were loaded.
    </Alert>
  </div>;
 const oldShow=one(params["show"]);
 const mappedShow=oldShow==="OPEN"?"NEW":oldShow==="DONE"?"RESOLVED":
    oldShow==="ALL"||oldShow==="POSTED"||oldShow==="REPLIES"?"ALL":null;
 // Duplicate/repeated query keys are ambiguous across proxies and URLs.
 // Reject them instead of choosing a different filter value by render order.
 const repeated=["status","kind","routingStatus","q","recipient","page","show"].some(key=>
   Array.isArray(params[key]));
 // A supplied, impossible page must fail closed rather than silently clamp
 // to page 1 (or 10000) and issue an unexpected private inbox read.
 const invalidPage=typeof params["page"]==="string"&&
   !/^(?:[1-9][0-9]{0,3}|10000)$/.test(params["page"]);
 const parsed=inboundMailListQuerySchema.safeParse({
  status:one(params["status"])??(oldShow==="POSTED"||oldShow==="REPLIES"?"ALL":mappedShow??"NEW"),
  // In the historical inbox "Replies" meant posted to a conversation,
  // including manually marked replies; it was NOT every email of kind REPLY.
  // vNext stores actual posting independently from human triage.
  kind:optional(params["kind"]),
  routingStatus:optional(params["routingStatus"])??((oldShow==="POSTED"||
    oldShow==="REPLIES")?"POSTED":undefined),
  q:one(params["q"]),recipient:optional(params["recipient"]),page:one(params["page"]),
 });
 if(repeated||invalidPage||(oldShow&&!mappedShow)||(oldShow&&params["status"]!==undefined)||!parsed.success)return <div className="min-w-0 space-y-4 md:space-y-6">{header}
   <Alert tone="warning">Invalid filters. <TextLink href="/admin/inbound-mail" className="inline-flex items-center min-h-11 md:min-h-9">Reset</TextLink></Alert></div>;
 const result=await listInboundMailForAdmin(context,parsed.data)
  .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
 if(!result.ok)return <div className="min-w-0 space-y-4 md:space-y-6">{header}
   <Alert tone="warning">
     Couldn't load inbound mail. Please try again. No unverified message rows are displayed.
     {" "}<TextLink href="/admin/inbound-mail">Retry inbox</TextLink>
   </Alert>
 </div>;
 const data=result.value;
 if(!data.available)return <div className="min-w-0 space-y-4 md:space-y-6">{header}
  <Alert tone="warning">
   <p>Inbound mail storage has not been registered or deployed. The inbox is unavailable; this is not a zero-message result.</p>
   <TextLink href="/admin/inbound-mail" className="inline-flex min-h-11 items-center">Retry</TextLink>
  </Alert></div>;
 const totalPages=data.total===null?null:Math.max(1,Math.ceil(data.total/50));
 const pageNumbers=totalPages===null?[]:Array.from(
  {length:Math.min(totalPages,7)},(_,i)=>Math.max(1,Math.min(data.page-3,totalPages-6))+i);
 const next=(page:number,clearSearch=false)=>{
  const url=new URLSearchParams();
  if(parsed.data.status!=="ALL")url.set("status",parsed.data.status);
  if(parsed.data.q&&!clearSearch)url.set("q",parsed.data.q);
  if(parsed.data.recipient)url.set("recipient",parsed.data.recipient);
  if(parsed.data.kind)url.set("kind",parsed.data.kind);
  if(parsed.data.routingStatus)url.set("routingStatus",parsed.data.routingStatus);
  if(page>1)url.set("page",String(page));
  return "/admin/inbound-mail"+(url.size?"?"+url.toString():"");
 };
 const base=new URLSearchParams({...parsed.data.q?{q:parsed.data.q}:{},
  ...parsed.data.recipient?{recipient:parsed.data.recipient}:{}});
 const tabs=[{value:"NEW",label:"To read",count:data.toReadCount},{value:"POSTED",label:"Posted to conversations",count:null},
  {value:"RESOLVED",label:"Done",count:null},{value:"ALL",label:"All",count:null},
  {value:"TRIAGED",label:"Being handled",count:null}] as const;
 return <div className="min-w-0 space-y-4 md:space-y-6">{header}
  {!INBOUND_ROUTING_METADATA_READY?<Alert tone="info">
    Automatic posting and manual triage are separate states. Historical manually
    marked replies require migration evidence; only verified posted outcomes are shown.
    Being handled does not confirm a recruiter reply was delivered.
    Only persisted inbox messages appear here.
  </Alert>:null}
  <div className="flex min-w-0 flex-wrap items-center gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
  <Tabs ariaLabel="Inbound mail views" value={parsed.data.routingStatus==="POSTED"?"POSTED":parsed.data.status} renderPanel={false}
    items={tabs.map(tab=>{
     const url=new URLSearchParams(base);
     if(tab.value==="POSTED"){url.set("status","ALL");url.set("routingStatus","POSTED");}
     else url.set("status",tab.value);
     return {value:tab.value,label:tab.label,
      ...(tab.count===null||tab.count===0?{}:{count:tab.count}),
      href:"/admin/inbound-mail?"+url.toString()};
    })}/>
  <form method="get" action="/admin/inbound-mail" role="search" aria-label="Search inbound mail"
    className="flex min-w-0 flex-1 flex-wrap items-end gap-2">
   <Input type="hidden" name="status" value={parsed.data.status}/>
   <Label className="min-w-0 w-full flex-1 sm:w-[300px] sm:max-w-[300px]">
    <span className="sr-only">Search sender, subject or text</span>
    <Input name="q" type="search" defaultValue={parsed.data.q} maxLength={120}
      aria-label="Search sender, subject or text"
      className="min-h-11 w-full md:min-h-9" placeholder="Search sender, subject or text"/>
   </Label>
   <Button type="submit" className="min-h-11 shrink-0 md:min-h-9">Search</Button>
   {parsed.data.q?<ButtonLink variant="secondary" href={next(1,true)} className="w-full md:w-auto">Clear</ButtonLink>:null}
   <Disclosure title="Recipient inbox · Status" defaultOpen={Boolean(parsed.data.recipient||parsed.data.kind||parsed.data.routingStatus)} className="w-full min-w-0 basis-full">
    <div className="grid min-w-0 gap-[var(--lms-space-3)] pt-[var(--lms-space-3)] md:grid-cols-2">
     <Label className="min-w-0">Recipient inbox
      <Input type="email" name="recipient" defaultValue={parsed.data.recipient??""} maxLength={320} className="mt-[6px] min-w-0" placeholder="inbox@example.edu"/></Label>
     <Label className="min-w-0">Routing outcome
      <Select name="routingStatus" defaultValue={parsed.data.routingStatus??""} className="mt-[6px] w-full">
        <option value="">All routing outcomes</option>
        {(["POSTED","STORED","NO_THREAD","WRONG_SENDER","NOT_VERIFIED","EMPTY","ACCESS_ENDED","FAILED"] as const).map(item=>
          <option key={item} value={item}>{item.replaceAll("_"," ")}</option>)}
      </Select></Label>
     <Label className="min-w-0">Message kind
      <Select name="kind" defaultValue={parsed.data.kind??""} className="mt-[6px] w-full">
        <option value="">All messages</option><option value="REPLY">Replies</option><option value="OTHER">Other mail</option>
      </Select></Label>
    </div>
   </Disclosure>
  </form>
  </div>
  <InboundMailList rows={data.items.map(x=>({
   id:x.id,receivedAt:x.receivedAt.toISOString(),fromAddress:x.fromAddress,
   toAddress:x.toAddress,subject:x.subject,bodyPlain:x.bodyPlain,status:x.status,version:x.version,
   routingStatus:x.routingStatus,handledAt:x.handledAt?.toISOString()??null,
  }))}/>
  <nav aria-label="Inbox pages" className="flex min-w-0 flex-col gap-[var(--lms-space-3)] text-sm md:flex-row md:items-center md:justify-between">
   <span className="min-w-0 text-body">
     {data.total===null?"Page "+data.page:
       (data.items.length?((data.page-1)*50+1)+"–"+((data.page-1)*50+data.items.length)+" of "+data.total:
       "0 of "+data.total)+" matching messages · Page "+data.page+" of "+totalPages}
   </span>
   <div className="flex w-full min-w-0 items-center gap-[var(--lms-space-2)] md:w-auto">
    {data.page>1?<ButtonLink variant="secondary" className="shrink-0" href={next(data.page-1)}>Previous</ButtonLink>:null}
    <div className="flex min-w-0 flex-1 items-center gap-[var(--lms-space-2)] overflow-x-auto pb-1 md:flex-none md:overflow-visible md:pb-0">
     {pageNumbers.map(n=><TextLink variant="bare" key={n} href={next(n)} aria-current={n===data.page?"page":undefined}
       className={n===data.page?"inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary-subtle px-3 py-2 text-primary-text focus-ring md:min-h-9 md:min-w-9":"inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-primary-text hover:border-primary hover:bg-primary-subtle focus-ring md:min-h-9 md:min-w-9"}>{n}</TextLink>)}
    </div>
    {data.hasMore?<ButtonLink variant="secondary" className="shrink-0" href={next(data.page+1)}>Next</ButtonLink>:null}
   </div>
  </nav>
 </div>;
}
