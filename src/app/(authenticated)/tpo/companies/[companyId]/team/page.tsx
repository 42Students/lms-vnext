import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {readTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
import {PageHeader} from "@/components/ui/page-header";
import {Alert} from "@/components/ui/alert";
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
 return <div className="min-w-0 space-y-4">
  <PageHeader  title={result.status==="READY"?
   "Company discussion · "+result.companyName:"Company discussion"}
   description="A college-private conversation about this company. Recruiters and students cannot read it." actions={<Link href={"/tpo/companies/"+encodeURIComponent(companyId)}
   className="lms-inline-link inline-flex min-h-11 items-center justify-center text-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Back to company</Link>}/>
  {result.status==="NOT_REGISTERED"?
   <Alert tone="warning">
    Company Team discussions require their registered database migration. No messages were inferred from private conversations.
   </Alert>:
   <>
    <TpoLiveRefresh intervalMs={30000}/>
    <ol aria-label="Company Team messages" className="min-w-0 divide-y divide-[var(--lms-canvas-border)]">
     {result.messages.map(message=><li key={message.id} id={"team-message-"+message.id}
      className="min-w-0 py-4">
      <p className="text-xs text-muted-foreground">{message.authorName??"Team member"} ·
       {" "}{new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
         dateStyle:"medium",timeStyle:"short"}).format(message.createdAt)} IST</p>
      <p className="mt-2 max-w-[72ch] whitespace-pre-wrap break-words text-sm text-body">{message.body}</p>
     </li>)}
    </ol>
    {result.truncated?<Alert tone="info">
     Showing the latest 100 company Team messages. Older messages are not loaded here.
    </Alert>:null}
    {!result.messages.length?<Alert tone="info">No company Team messages yet.</Alert>:null}
    {result.canPost?<TpoCompanyTeamComposer companyId={companyId} actorUserId={context.user.id}/>:
     <Alert tone="info">This relationship is archived. Its discussion is read-only.</Alert>}
   </>
  }
 </div>;
}
