import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasPlacementTeamMembership} from "@/modules/placements/placement-team-access-model";
import {companyTeamCompanyIdSchema,readTpoCompanyTeam,TpoCompanyTeamError} from "@/modules/placements/tpo-company-team-service";
import {TpoCompanyTeamConversation} from "@/components/tpo/tpo-company-team-conversation";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
export default async function CompanyTeamPage({params}:{params:Promise<{companyId:string}>}){
 const context=await getCurrentRequestContext();
 if(!context.membership||!hasPlacementTeamMembership(context))redirect("/dashboard");
 const {companyId}=await params;
 if(!companyTeamCompanyIdSchema.safeParse(companyId).success)notFound();
 let state:Awaited<ReturnType<typeof readTpoCompanyTeam>>;
 try{state=await readTpoCompanyTeam(context,companyId);}
 catch(error){if(error instanceof TpoCompanyTeamError&&error.code==="NOT_FOUND")notFound();throw error;}
 return <div className="min-w-0 space-y-5">
  <PageHeader title={state.companyName}
    description="Private placement-team company conversation. Recruiters and learners cannot view it."
    actions={<PageBackLink href={"/tpo/companies/"+encodeURIComponent(companyId)} label="Company profile" />}/>
  <TpoCompanyTeamConversation companyId={companyId} companyName={state.companyName}
    actorMembershipId={context.membership.id}/>
 </div>;
}
