import Link from "next/link";
import {redirect} from "next/navigation";
import ActivityPage from "@/app/(authenticated)/activity/page";
import {getCurrentRequestContext} from "@/auth/request-context";
import {ErrorState} from "@/components/ui/error-state";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import {isSuperAdmin,hasMembershipRole} from "@/modules/identity/context";
import {listSmsDeliveryAttemptsForSupport} from "@/modules/notifications/exotel-sms";
import {validateSuperAdminAuditRouteQuery} from "@/modules/activity/super-admin-audit-route-query-model";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

function smsDate(value:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
  dateStyle:"medium",timeStyle:"short"}).format(value)+" IST";
}
export default async function SuperAdminAuditPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 let context:Awaited<ReturnType<typeof getCurrentRequestContext>>;
 try{context=await getCurrentRequestContext();}
 catch{return <div className="min-w-0 space-y-4">
  <PageHeader title="Audit Log"/>
  <ErrorState title="Your session has expired" description="Sign in again to see authorized audit records."
   action={<Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Sign in</Link>}/>
 </div>;}
 if(!isSuperAdmin(context)){
  if(hasMembershipRole(context,"COLLEGE_ADMIN"))redirect("/activity");
  redirect("/dashboard");
 }
 const raw=await searchParams;
 const parsed=validateSuperAdminAuditRouteQuery(raw);
 const unsupported=typeof raw.category==="string"?raw.category.trim().slice(0,80):null;
 if(!parsed)return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin" title="Audit Log"/>
  <ErrorState title="Invalid audit filters" description={unsupported?
   "Unknown activity category: "+unsupported+".":"Check dates, college, page size and event filters."}
   action={<Link href="/admin/audit" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Clear filters</Link>}/>
 </div>;
 const {smsPage,smsSize,allowGlobal,embedded,...activityParams}=parsed;
 const selectedCollege=context.adminScope?.collegeId??parsed.collegeId??null;
 const scopedOnly=allowGlobal==="false" || embedded==="true";
 const blocked=scopedOnly&&!selectedCollege;
 const currentSmsPage=Number(smsPage??0);
 const currentSmsSize=Number(smsSize??50);
 const isGlobal= !context.adminScope?.collegeId&&!context.adminScope?.organizationId;
 const mainScope=context.adminScope?.collegeId;
 // The Support SMS read is global Super Admin only. Do not circumvent this
 // restriction by emulating a scoped query over the global attempt table.
 const smsRead=(!blocked&&isGlobal)?await (async()=>{
  try{
   const offset=currentSmsPage*currentSmsSize,firstPage=Math.floor(offset/100)+1;
   if(firstPage>100000)return {ok:false as const};
   const first=await listSmsDeliveryAttemptsForSupport(context,{page:firstPage,size:100});
   if(!first.ready)return {ok:true as const,ready:false as const};
   const all=[...first.entries];
   let page=firstPage+1;
   while(all.length < (offset%100)+currentSmsSize && (page-1)*100<first.totalElements){
    const next=await listSmsDeliveryAttemptsForSupport(context,{page,size:100});
    all.push(...next.entries);page++;
   }
   return {ok:true as const,ready:true as const,rows:all.slice(offset%100,offset%100+currentSmsSize),
    total:first.totalElements,totalPages:Math.max(1,Math.ceil(first.totalElements/currentSmsSize))};
  }catch{return {ok:false as const};}
 })():null;
 const smsHref=(page:number,size=currentSmsSize)=>{
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(raw))
   if(typeof value==="string"&&key!=="smsPage"&&key!=="smsSize"&&value.length<=500)query.set(key,value);
  query.set("smsPage",String(page));query.set("smsSize",String(size));
  return "/admin/audit?"+query.toString();
 };
 return <div className="min-w-0 space-y-5 md:space-y-6">
  <nav aria-label="Super Admin audit tabs" className="flex min-w-0 flex-wrap items-center gap-3 border-b border-[var(--lms-canvas-border)] pb-3">
   <span aria-current="page" className="inline-flex min-h-11 items-center border-b-2 border-[var(--lms-primary)] px-3 text-sm font-semibold text-primary-text md:min-h-9">Audit Log</span>
   <Link href="/tracker/audit-findings" className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-body hover:text-primary-text md:min-h-9">Audit Findings</Link>
  </nav>
  {blocked?<Alert tone="warning" title="Select a College to view audit logs">
   This scoped view cannot show platform-wide events. Select a college from the header, then retry.
  </Alert>:<div className={embedded==="true"?"[&_[aria-label='Activity_Log_filters']]:hidden":""}>
   <ActivityPage searchParams={Promise.resolve({
    ...activityParams,...(mainScope?{collegeId:mainScope}:{}),
   })}/>
  </div>}
  {!blocked?<section aria-label="SMS delivery attempts" className="min-w-0 space-y-3 border-t border-[var(--lms-canvas-border)] pt-4">
   <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
    <div><h2 className="text-base font-semibold text-[var(--lms-heading)]">SMS delivery attempts</h2>
     <p className="mt-1 text-xs text-muted-foreground">Newest attempts first. Provider accepted does not mean handset delivered. Phone numbers, codes and message bodies are not shown.</p>
    </div>
    {isGlobal?<form method="get" action="/admin/audit" className="flex items-center gap-2">
     {Object.entries(raw).filter(([key,value])=>key!=="smsPage"&&key!=="smsSize"&&typeof value==="string")
      .map(([key,value])=><input key={key} type="hidden" name={key} value={value as string}/>)}
     <label className="text-xs font-semibold text-muted-foreground">Rows per page
      <Select name="smsSize" aria-label="SMS attempts per page" defaultValue={String(currentSmsSize)}
       className="ml-2">
       {[50,100,200].map(size=><option key={size} value={size}>{size}</option>)}
      </Select></label>
     <Button variant="secondary" type="submit" >Apply</Button>
    </form>:null}
   </div>
   {!isGlobal?<Alert tone="info">SMS provider attempts are available only from the unscoped Super Admin support view. Switch out of the selected college or organization to inspect them; this section never falls back to global data within a scoped view.</Alert>:
    !smsRead?.ok?<Alert tone="error" title="Could not load SMS attempts">
     <Link href={smsHref(currentSmsPage)} className="font-semibold text-primary-text underline">Retry SMS attempts</Link>
    </Alert>:!smsRead.ready?<Alert tone="warning">SMS provider-attempt ledger is not ready. No records or delivery counts are inferred from activity events.</Alert>:
     smsRead.rows.length===0?<p role="status" className="py-4 text-sm text-muted-foreground">No SMS attempts match this page.</p>:
     <div className="min-w-0 overflow-x-auto rounded border border-[var(--lms-canvas-border)]">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
       <thead><tr className="bg-muted text-xs text-muted-foreground">
        <th scope="col" className="p-3">Attempted</th>
        <th scope="col" className="p-3">Purpose</th>
        <th scope="col" className="p-3">Recipient</th>
        <th scope="col" className="p-3">Outcome</th>
        <th scope="col" className="p-3">Details</th>
       </tr></thead>
       <tbody>{smsRead.rows.map(item=><tr key={item.id} className="border-t border-border">
        <td className="p-3 tabular-nums">{smsDate(new Date(item.createdAt))}</td>
        <td className="p-3">{item.purpose}</td>
        <td className="p-3">{item.recipientSuffix?"••••"+item.recipientSuffix:"Masked"}</td>
        <td className="p-3"><StatusBadge tone={item.outcome==="PROVIDER_ACCEPTED"?"success":"warning"}>{item.outcome==="PROVIDER_ACCEPTED"?"Accepted by provider":item.outcome}</StatusBadge></td>
        <td className="p-3"><details><summary className="min-h-9 cursor-pointer font-semibold text-primary-text">View details</summary>
         <dl className="min-w-0 space-y-2 py-2 text-xs">
          <div><dt className="font-semibold">Attempt ID</dt><dd className="break-all">{item.id}</dd></div>
          <div><dt className="font-semibold">Provider ID</dt><dd className="break-all">{item.providerMessageId??"Not available"}</dd></div>
          <div><dt className="font-semibold">Provider</dt><dd>{item.provider}</dd></div>
          <div><dt className="font-semibold">Error code</dt><dd>{item.safeFailureCode??"—"}</dd></div>
         </dl>
        </details></td>
       </tr>)}</tbody>
      </table>
     </div>}
   {isGlobal&&smsRead?.ok&&smsRead.ready?<nav aria-label="SMS attempts pagination"
    className="flex flex-wrap items-center justify-between gap-3 text-sm">
    <span role="status" className="text-xs text-muted-foreground">
     Page {currentSmsPage+1} of {smsRead.totalPages} · {smsRead.total} matching attempts · maximum 200 per page
    </span>
    <div className="flex gap-2">
     {currentSmsPage>0?<Link href={smsHref(currentSmsPage-1)}
      className="inline-flex min-h-11 items-center rounded border border-border px-3 font-semibold text-primary-text md:min-h-9">Previous</Link>:
      <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded border border-border px-3 text-muted-foreground opacity-60 md:min-h-9">Previous</span>}
     {currentSmsPage+1<smsRead.totalPages?<Link href={smsHref(currentSmsPage+1)}
      className="inline-flex min-h-11 items-center rounded border border-border px-3 font-semibold text-primary-text md:min-h-9">Next</Link>:
      <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded border border-border px-3 text-muted-foreground opacity-60 md:min-h-9">Next</span>}
    </div>
   </nav>:null}
  </section>:null}
 </div>;
}
