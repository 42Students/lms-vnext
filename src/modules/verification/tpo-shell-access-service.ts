import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {VerificationUnavailableError} from "./staff-auth";
import {requireTpoVerificationActor} from "./tpo-staff-auth";
export async function getTpoShellVerificationAccess(ctx:RequestContext):Promise<boolean>{
 try{await requireTpoVerificationActor(ctx);return true;}
 catch(error){
  if(error instanceof AuthorizationError||error instanceof VerificationUnavailableError)return false;
  throw error;
 }
}
