import {AuthorizationError} from "@/modules/permissions/policy";
/** Preserve the required membership denial; only optional source failures can be isolated. */
export async function readOptionalLearnerAlertSource<T>(load:()=>Promise<T[]>):Promise<
 {available:true;items:T[]}|{available:false;items:[]}
>{
 try{return {available:true,items:await load()};}
 catch(error){
  if(error instanceof AuthorizationError)throw error;
  return {available:false,items:[]};
 }
}
