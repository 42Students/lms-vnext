import { z } from "zod";
/** A remount key is derived from the server-authorized delivery ID; never
 * carry the previous Course's messages, unsent reply or paging cursor over. */
export function learnerDiscussionScopeKey(deliveryId:string):string{
 return z.string().uuid().parse(deliveryId);
}
