import {readBoundedJsonRequest} from "@/lib/bounded-json-request";

/** Keep the delivery-lock default 8-KiB body limit. */
export async function readLimitedProjectLockInput(request:Request,maxBytes=8192){
 return readBoundedJsonRequest(request,maxBytes);
}
