import "server-only";
import {z} from "zod";
import type {RequestContext} from "@/modules/identity/context";
import {getRecruiterPlacementWorkspace} from "./recruiter-workspace-service";
import {listMessageThreads} from "./tpo-messaging-service";
import {recruiterDriveThreads} from "./hr-drive-conversation-model";
/** Drive scope is resolved through the existing recruiter-authorized workspace first. */
export async function getRecruiterDriveConversations(context:RequestContext,rawJobId:unknown){
 const jobId=z.string().uuid().parse(rawJobId);
 const workspace=await getRecruiterPlacementWorkspace(context,jobId);
 const all=await listMessageThreads(context,workspace.college.id);
 const threads=recruiterDriveThreads(all,workspace.job.id);
 return {workspace,threads};
}
