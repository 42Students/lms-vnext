import { z } from "zod";

export const facultyDiscussionHistorySchema=z.object({
  deliveryId:z.string().uuid(),
  action:z.enum(["ALL","PIN","DELETE","REPLY"]).default("ALL"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
}).strict();
export type FacultyDiscussionHistoryQuery=z.infer<typeof facultyDiscussionHistorySchema>;

export function discussionHistoryPagination(total:number,requested:number) {
  const pageSize=20;
  const totalPages=Math.max(1,Math.ceil(total/pageSize));
  return {total,pageSize,totalPages,page:Math.min(requested,totalPages)};
}
export function facultyDiscussionHistoryHref(query:FacultyDiscussionHistoryQuery) {
  const params=new URLSearchParams();
  if(query.action!=="ALL") params.set("action",query.action);
  if(query.page>1) params.set("page",String(query.page));
  const suffix=params.toString();
  return "/teacher/courses/"+encodeURIComponent(query.deliveryId)+
    "/discussion-history"+(suffix?"?"+suffix:"");
}
/** Deletion events include learner self-delete, so never label them Faculty-only. */
export function discussionHistoryLabel(eventType:string,pinned:unknown) {
  if(eventType==="courses.discussion.pin_changed") {
    return pinned===true ? "Pinned by moderator" :
      pinned===false ? "Unpinned by moderator" : "Pin state changed";
  }
  if(eventType==="courses.discussion.deleted") return "Discussion deletion recorded";
  if(eventType==="courses.discussion.replied") return "Faculty reply recorded";
  return "Unknown discussion activity";
}
