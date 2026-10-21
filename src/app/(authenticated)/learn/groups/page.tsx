import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {hasMembershipRole} from "@/modules/identity/context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {LearnerGroupLists} from "@/components/groups/learner-group-lists";
import {listLearnerGroups} from "@/modules/groups/learner-group-list-service";
export const dynamic="force-dynamic";
export default async function LearnerGroupsPage(){
 const context=await getCurrentRequestContext();
 if(!hasMembershipRole(context,"LEARNER"))redirect("/dashboard");
 const data=await listLearnerGroups(context).catch(()=>null);
 return <div className="min-w-0 space-y-4">
  <PageHeader title="Groups" description="Your groups and groups accepting members."/>
  {data?<LearnerGroupLists mine={data.mine} open={data.open}/>:
   <ErrorState title="Could not load groups" description="No empty group list has been assumed. Refresh the page to try again."/>}
 </div>;
}
