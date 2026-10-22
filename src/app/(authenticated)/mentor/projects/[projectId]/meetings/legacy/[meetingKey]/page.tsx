import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {resolveLegacyMeetingKeyLink}
 from "@/modules/projects/legacy-meeting-link-service";

/** Old meetingKey anchors are project-local. Resolve with the current member
 * scope, then redirect to an actual UUID meeting card rather than guessing
 * a UUID from the old free-text key or exposing its presence cross-college. */
export default async function LegacyMentorMeetingPage({params}:{
 params:Promise<{projectId:string;meetingKey:string}>;
}){
 const {projectId,meetingKey}=await params;
 const result=await resolveLegacyMeetingKeyLink(
  await getCurrentRequestContext(),projectId,meetingKey);
 redirect("/mentor/projects/"+encodeURIComponent(result.projectId)+
  "?tab=team#meeting-"+encodeURIComponent(result.meetingId));
}
