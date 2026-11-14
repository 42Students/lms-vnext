import { z } from "zod";
import { zUuid } from "@/lib/schema-primitives";
/** A remount key is derived from the server-authorized delivery ID; never
 * carry the previous Course's messages, unsent reply or paging cursor over. */
export function learnerDiscussionScopeKey(deliveryId:string):string{
 return zUuid.parse(deliveryId);
}
