import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {AuthorizationError} from "@/modules/permissions/policy";
import {publicPlacementPublicationInput} from "@/modules/placements/public-page/publication-policy";
import {setTpoPublicPlacementPublication,PublicPlacementPublishError} from "@/modules/placements/public-page/publication-service";

export const runtime="nodejs";

export async function POST(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 const form=await request.formData().catch(()=>null);
 if(!form)return NextResponse.json({error:"INVALID_BODY"},{status:400});
 const enabled=form.get("enabled");
 const parsed=publicPlacementPublicationInput.safeParse({
  enabled:enabled==="true"?true:enabled==="false"?false:null,
 });
 if(!parsed.success || form.has("populationCount") || form.has("collegeId"))
  return NextResponse.json({error:"INVALID_BODY"},{status:400});
 try{
  const ctx=await getCurrentRequestContext();
  await setTpoPublicPlacementPublication(ctx,parsed.data);
  return NextResponse.redirect(new URL("/tpo/settings/public-page?updated=1",request.url),303);
 }catch(e){
  if(e instanceof AuthorizationError)return NextResponse.json({error:"FORBIDDEN"},{status:403});
  if(e instanceof PublicPlacementPublishError)
   return NextResponse.json({error:e.code},{status:e.code==="NOT_REGISTERED"?503:409});
  throw e;
 }
}
