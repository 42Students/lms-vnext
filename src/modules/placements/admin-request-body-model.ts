import {readBoundedJsonRequest} from "@/lib/bounded-json-request";

/** Preserve the placement mutation reader API while sharing the byte limit. */
export async function readAdminPlacementJson(request:Request,maxBytes:number){
 return readBoundedJsonRequest(request,maxBytes);
}
