import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getPrincipalModuleFlags} from "@/modules/module-access/learner-shell-access";

/** Legacy GET features/me: authenticated current-principal only, no caller
 * college or role override and no cache of another person's access.
 */
export async function GET(){
  const context=await getCurrentRequestContext().catch(()=>null);
  const result=await getPrincipalModuleFlags(context);
  if(!result.ok)return NextResponse.json({status:result.status,message:result.message},{
    status:result.status==="NOT_AUTHENTICATED"?401:
      result.status==="COLLEGE_SCOPE_REQUIRED"?403:503,
    headers:{"cache-control":"no-store"},
  });
  return NextResponse.json({status:"OK",message:"OK",data:result.flags},{
    headers:{"cache-control":"no-store"},
  });
}
