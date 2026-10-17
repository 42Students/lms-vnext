import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assignTpoUnownedWork,tpoAssignUnownedSchema} from "@/modules/placements/tpo-team-unowned-service";
export const runtime="nodejs";
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const parsed=tpoAssignUnownedSchema.safeParse(await request.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{return NextResponse.json(await assignTpoUnownedWork(await getCurrentRequestContext(),parsed.data));}
 catch(error){
  if(error instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(error instanceof z.ZodError)return NextResponse.json({error:"INVALID_BODY"},{status:400});
  if(error instanceof Error&&error.message==="TEAM_MEMBER_NOT_FOUND")
   return NextResponse.json({error:"RECIPIENT_NOT_FOUND"},{status:404});
  if(error instanceof Error&&error.message==="TEAM_OWNERSHIP_NOT_REGISTERED")
   return NextResponse.json({error:"UNAVAILABLE"},{status:503});
  throw error;
 }
}
