import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoVerificationQueue} from "@/modules/placements/tpo-verification-queue-service";
import type {TpoVerificationQuery} from "./tpo-queue-server-model";
import type {VerificationQueueCard} from "@/components/verification/VerificationWorkspace";

/** Bounded server-side export; collect one extra row to prove a truncated result. */
export async function readTpoVerificationExport(context:RequestContext,filters:Pick<TpoVerificationQuery,"tab"|"kind"|"search"|"batchId"|"branchId">){
 const rows:VerificationQueueCard[]=[];
 for(let page=1;page<=11;page++){
  const queue=await getTpoVerificationQueue(context,{
   ...filters,waitingState:"ALL",page,pageSize:100,
  });
  if(!queue.available||!queue.enabled||!queue.permitted)return {...queue,rows:[],hasMore:false};
  rows.push(...queue.rows);
  if(!queue.hasMore||rows.length>1000)break;
 }
 return {available:true,enabled:true,permitted:true,rows,hasMore:rows.length>1000};
}
