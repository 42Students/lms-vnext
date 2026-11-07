import {NextResponse} from "next/server";
import {getPublicJoinPreview} from "@/modules/placements/public-join/preview-service";
import { route } from "@/security/route";
export const runtime="nodejs";
export const dynamic="force-dynamic";
async function handleGET(_request:Request,{params}:{params:Promise<{token:string}>}){
 try{
  const {token}=await params;
  const preview=await getPublicJoinPreview(token,"COMPANY");
  if(preview.kind!=="READY")
   return NextResponse.json({success:false,error:"NOT_FOUND"},{status:404,headers:{"Cache-Control":"no-store"}});
  return NextResponse.json({success:true,data:{
   collegeName:preview.collegeName,companyName:preview.companyName,
   companyDomain:preview.companyDomain,
  }},{headers:{"Cache-Control":"no-store"}});
 }catch{
  return NextResponse.json({success:false,error:"SERVICE_UNAVAILABLE"},{status:503,headers:{"Cache-Control":"no-store"}});
 }
}
export const GET = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", csrf: false, csrfExemptReason: "Links and email clients send no same-origin header; the handler validates the token or applies its own origin check.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);
