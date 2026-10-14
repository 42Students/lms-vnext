import {z} from "zod";
export const mentorCloseoutParamsSchema=z.object({projectId:z.string().uuid()}).strict();
export const mentorCloseoutSchema=z.object({
  expectedUpdatedAt:z.iso.datetime({offset:true}),
  confirmDeliveryReviewed:z.literal(true),
  confirmTeamNotified:z.literal(true),
  confirmCloseout:z.literal(true),
}).strict();
export function closeoutChecklist(input:{
  projectStatus:string; approved:boolean;
  openTasks:number; openSprints:number; openReleases:number;
}) {
  return {
    approvedDelivery:input.approved,
    tasksDone:input.openTasks===0,
    sprintsComplete:input.openSprints===0,
    releasesShipped:input.openReleases===0,
    canComplete:input.projectStatus==="ACTIVE"&&input.approved&&
      input.openTasks===0&&input.openSprints===0&&input.openReleases===0,
  };
}
