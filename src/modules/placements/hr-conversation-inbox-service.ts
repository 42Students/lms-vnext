import "server-only";
import {hasActiveRecruiter,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {listMessageThreads} from "./tpo-messaging-service";
import {listOwnRecruiterPlacementJobs} from "./recruiter-service";
import {hrConversationQuerySchema,filterRecruiterConversations} from "./hr-conversation-inbox-model";
export async function listHrConversations(context:RequestContext,raw:unknown={}){
 const query=hrConversationQuerySchema.parse(raw);
 if(!hasActiveRecruiter(context)||!context.recruiter)throw new AuthorizationError("placements.recruiter.read");
 const grants=context.recruiter.grants;
 if(query.collegeId&&!grants.some(g=>g.collegeId===query.collegeId))
  throw new AuthorizationError("placements.recruiter.read");
 const unique=[...new Set(grants.map(g=>g.collegeId))];
 const collegeId=query.collegeId??(unique.length===1?unique[0]:null);
 if(!collegeId)return {status:unique.length?"CHOOSE_COLLEGE" as const:"NO_ACCESS" as const,
  choices:grants,items:[],collegeId:null};
 const [threads,jobs]=await Promise.all([
  listMessageThreads(context,collegeId),
  listOwnRecruiterPlacementJobs(context),
 ]);
 const allowed=jobs.filter(j=>j.collegeId===collegeId&&j.companyId===context.recruiter!.companyId);
 const knownJobIds=new Set(allowed.map(j=>j.job.id));
 const titles=new Map(allowed.map(j=>[j.job.id,j.job.title]));
 const filtered=filterRecruiterConversations(threads,knownJobIds,query.q);
 return {status:"READY" as const,choices:grants,collegeId,
  items:filtered.slice(0,100).map(t=>({
   id:t.id,jobId:t.jobId,jobTitle:t.jobId?(titles.get(t.jobId)??"Authorized drive"):"General conversation",
   lastMessageAt:t.lastMessageAt,createdAt:t.createdAt,
  })),truncated:filtered.length>100};
}
