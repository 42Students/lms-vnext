import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {readTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
import {PageHeader} from "@/components/ui/page-header";
import {TpoCompanyTeamComposer} from "@/components/tpo/tpo-company-team-composer";
import {TpoLiveRefresh} from "@/components/tpo/tpo-live-refresh";

export default async function TpoCompanyTeamPage({params}:{
 params:Promise<{companyId:string}>;
}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasPlacementTeamMembership(context))redirect("/dashboard");
 const {companyId}=await params;
 if(!z.string().uuid().safeParse(companyId).success)notFound();
 // The shared company-team service now rejects unknown/foreign company IDs
 // with a typed error rather than a NOT_FOUND result variant.
 let result:Awaited<ReturnType<typeof readTpoCompanyTeam>>;
 try{
  result=await readTpoCompanyTeam(context,companyId);
 }catch(error){
  if(error instanceof TpoCompanyTeamError&&error.code==="NOT_FOUND")notFound();
  throw error;
 }
 // The read model preserves history for archived relationships; only ACTIVE can post.
 return <main className="space-y-5">
  <PageHeader eyebrow="TPO · Team" title={result.status==="READY"?
   "Company discussion · "+result.companyName:"Company discussion"}
   description="A college-private conversation about this company. Recruiters and students cannot read it."/>
  <Link href={"/tpo/companies/"+encodeURIComponent(companyId)}
   className="inline-flex min-h-9 items-center text-sm text-primary-text underline">Back to company</Link>
  {result.status==="NOT_REGISTERED"?
   <p role="status" className="border-l-[3px] border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] px-4 py-3 text-sm text-body">
    Company Team discussions require their registered database migration. No messages were inferred from private conversations.
   </p>:
   <>
    <TpoLiveRefresh intervalMs={30000}/>
    <ol aria-label="Company Team messages" className="space-y-3">
     {result.messages.map(message=><li key={message.id} id={"team-message-"+message.id}
      className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <p className="text-xs text-muted-foreground">{message.authorName??"Team member"} ·
       {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
         dateStyle:"medium",timeStyle:"short"}).format(message.createdAt)} IST</p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
     </li>)}
    </ol>
    {result.truncated?<p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">
     Showing the latest 100 company Team messages. Older messages are not loaded here.
    </p>:null}
    {!result.messages.length?<p role="status" className="text-sm text-body">
     No company Team messages yet.</p>:null}
    {result.canPost?<TpoCompanyTeamComposer companyId={companyId} actorUserId={context.user.id}/>:
     <p role="status" className="text-sm text-body">
      This relationship is archived. Its discussion is read-only.
     </p>}
   </>
  }
 </main>;
}
