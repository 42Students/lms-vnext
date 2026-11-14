import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {listMessageThreads} from "./tpo-messaging-service";
import {recruiterDriveThreads} from "./hr-drive-conversation-model";
import { zUuid } from "@/lib/schema-primitives";
/** Drive scope is resolved through the existing recruiter-authorized workspace first. */
export async function getRecruiterDriveConversations(context:RequestContext,rawJobId:unknown){
 const jobId=zUuid.parse(rawJobId);
 const workspace=await getRecruiterPlacementWorkspace(context,jobId);
 const all=await listMessageThreads(context,workspace.college.id);
 // Defense in depth: neither a returned thread's recruiter identity nor
 // its college may be inferred from the job title or the nested list response.
 const ownedCollege=all.filter(thread=>thread.collegeId===workspace.college.id);
 const threads=recruiterDriveThreads(ownedCollege,workspace.job.id,context.user.id);
 return {workspace,threads};
}
