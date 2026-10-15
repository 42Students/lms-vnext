import { AuthorizationError } from "@/modules/permissions/policy";
/** An optional read may fail separately; permission revocation is never downgraded
 * to a partial success in an authenticated learner page. */
export async function readOptionalLearnerPlacementSource<T>(read:()=>Promise<T>):
 Promise<{available:true;value:T}|{available:false;value:null}>{
 try{return {available:true,value:await read()};}
 catch(error){if(error instanceof AuthorizationError)throw error;return {available:false,value:null};}
}
