import {NextResponse} from "next/server";
import {GET as listOrganizations} from "@/app/api/organizations/route";
import { secured } from "@/security/secure-handler";

/** Old /fetch reads still follow the canonical tenant/role-scoped reader. */
async function handleGET(){
 const response=await listOrganizations();
 if(!response.ok)return response;
 const body=await response.json() as {organizations:unknown};
 return NextResponse.json({status:"OK",message:"OK",data:body.organizations},
  {status:200,headers:{"cache-control":"private, no-store","deprecation":"true"}});
}
export const GET = secured(handleGET);
