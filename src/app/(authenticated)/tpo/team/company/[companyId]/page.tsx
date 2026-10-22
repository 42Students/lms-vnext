import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {companyTeamCompanyIdSchema,readTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
import {TpoCompanyTeamConversation} from "@/components/tpo/tpo-company-team-conversation";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {ErrorState} from "@/components/ui/error-state";
import {AuthorizationError} from "@/modules/permissions/policy";
export default async function CompanyTeamPage({params}:{params:Promise<{companyId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasPlacementTeamMembership(context))redirect("/dashboard");
 const {companyId}=await params;
 if(!companyTeamCompanyIdSchema.safeParse(companyId).success)notFound();
 let state:Awaited<ReturnType<typeof readTpoCompanyTeam>>;
 try{state=await readTpoCompanyTeam(context,companyId);}
 catch(error){
  if(error instanceof TpoCompanyTeamError&&error.code==="NOT_FOUND")notFound();
  if(error instanceof AuthorizationError||
    (error instanceof TpoCompanyTeamError&&error.code==="NOT_AUTHORIZED"))throw error;
  return <div className="min-w-0 max-w-full space-y-4">
   <PageHeader title="Company Team" actions={<PageBackLink
     href={"/tpo/companies/"+encodeURIComponent(companyId)} label="Company profile"/>}/>
   <ErrorState title="Company conversation unavailable"
     description={error instanceof TpoCompanyTeamError&&error.code==="STORAGE_PENDING"
       ?"Company Team conversation storage has not been registered yet."
       :"The company conversation could not be loaded. No messages were changed."}
     retryHref={"/tpo/team/company/"+encodeURIComponent(companyId)} retryLabel="Retry conversation"/>
  </div>;
 }
 return <div className="min-w-0 max-w-full space-y-6">
  <PageHeader title={state.companyName}
    description="Private placement-team company conversation. Recruiters and learners cannot view it."
    actions={<PageBackLink href={"/tpo/companies/"+encodeURIComponent(companyId)} label="Company profile" />}/>
  <TpoCompanyTeamConversation companyId={companyId} companyName={state.companyName}
    actorMembershipId={context.membership.id}/>
 </div>;
}
