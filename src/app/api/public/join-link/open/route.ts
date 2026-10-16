import {NextResponse} from "next/server";
import {z} from "zod";
import {isSameOriginRequest} from "@/auth/origin";
import {recordPublicJoinOpen} from "@/modules/placements/public-join/open-service";
export const runtime="nodejs";
const schema=z.strictObject({token:z.string().min(32).max(256),scope:z.enum(["COLLEGE","COMPANY"])});
export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const input=schema.safeParse(await request.json().catch(()=>null));
 if(!input.success)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const opened=await recordPublicJoinOpen(input.data.token,input.data.scope);
 return NextResponse.json({opened},{headers:{"Cache-Control":"no-store"}});
}
