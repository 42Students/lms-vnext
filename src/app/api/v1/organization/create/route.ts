import {NextResponse} from "next/server";
import {isSameOriginRequest} from "@/auth/origin";
import {POST as createOrganization} from "@/app/api/organizations/route";

/** Compatibility for old organization creation; canonical auth, origin and scope
 * checks execute before translating only the response envelope. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const response=await createOrganization(request);
 if(!response.ok)return response;
 const body=await response.json() as {organization:unknown};
 return NextResponse.json({status:"OK",message:"OK",data:body.organization},
  {status:200,headers:{"cache-control":"private, no-store","deprecation":"true"}});
}
