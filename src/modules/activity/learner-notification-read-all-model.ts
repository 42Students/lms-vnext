import {z} from "zod";
export const learnerNotificationReadAllSchema=z.object({
  confirmed:z.literal(true),
}).strict();
export function learnerNotificationPendingCount(
  items:readonly {source?:"ANNOUNCEMENT";readAt:string|null}[],
){
  return items.filter(item=>item.source!=="ANNOUNCEMENT"&&item.readAt===null).length;
}
