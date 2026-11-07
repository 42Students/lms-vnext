import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readCollegeLogoForm,CollegeLogoRequestError} from "@/modules/colleges/college-logo-request-body";
import {CollegeLogoError,uploadCollegeLogo,getPublicCollegeLogo,removeCollegeLogo} from "@/modules/colleges/admin-branding-logo-service";
import { route } from "@/security/route";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// The logo uses an explicitly scoped same-origin multipart endpoint as the
// CORS-free fallback for its own PNG type only. Other file categories must
// preserve their own grants/policies, not reuse college branding permissions.
// Upload/removal persists independently of other branding fields; a future
// staged form-save protocol must be coordinated with the branding owner.
// Legacy /api/v1/upload?folder=... has no safe global equivalent: this endpoint
// accepts only a college logo, with college UUID in its path. Optional legacy
// multipart folder/type/bindingId hints must match this route exactly.
// Branding images are normalized, verified PNGs with a conservative 2 MiB cap,
// not arbitrary 5 MiB historical R2 uploads; cropping happens in the client.
// Other uploads route to their own assignment/attachment scoped endpoints.
type Params={params:Promise<{collegeId:string}>};
async function handlePOST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const {collegeId}=await params;
  const form=await readCollegeLogoForm(request);
  const entries=[...form.keys()];
  const allowed=new Set(["file","folder","type","bindingId"]);
  if(entries.some(key=>!allowed.has(key))||entries.filter(key=>key==="file").length!==1||
     entries.some(key=>key!=="file"&&entries.filter(other=>other===key).length!==1))
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  if((form.has("folder")&&form.get("folder")!=="branding")||
     (form.has("type")&&form.get("type")!=="logo")||
     (form.has("bindingId")&&form.get("bindingId")!==collegeId))
   return NextResponse.json({error:"INVALID_BINDING"},{status:400});
  const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  if(file.size>2*1024*1024)
   return NextResponse.json({error:"LOGO_TOO_LARGE",message:"Use a PNG logo no larger than 2 MiB."},{status:413});
  const result=await uploadCollegeLogo(context,collegeId,file);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){
  if(error instanceof CollegeLogoRequestError)return NextResponse.json({error:error.code},{
   status:error.code==="LOGO_TOO_LARGE"?413:400,
   headers:{"Cache-Control":"private, no-store"},
  });
  if(error instanceof CollegeLogoError)
   return NextResponse.json({error:error.code},{status:error.code==="COLLEGE_NOT_FOUND"?404:
    error.code==="LOGO_TOO_LARGE"?413:error.code==="LOGO_INVALID"?400:503});
  return apiErrorResponse(error);
 }
}
export const POST = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handlePOST(request as Parameters<typeof handlePOST>[0], { params: Promise.resolve(params) } as Parameters<typeof handlePOST>[1]),
);
async function handleGET(_request:Request,{params}:Params){
 try{
  const file=await getPublicCollegeLogo((await params).collegeId);
  if(!file)return new Response(null,{status:404,headers:{"Cache-Control":"no-store"}});
  return new Response(file.body,{headers:{
    "Content-Type":"image/png","X-Content-Type-Options":"nosniff",
    "Content-Security-Policy":"default-src 'none'; sandbox",
    "Cache-Control":"public, max-age=60",
  }});
 }catch{return new Response(null,{status:503,headers:{"Cache-Control":"no-store"}});}
}
export const GET = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handleGET(request as Parameters<typeof handleGET>[0], { params: Promise.resolve(params) } as Parameters<typeof handleGET>[1]),
);

async function handleDELETE(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await removeCollegeLogo(await getCurrentRequestContext(),(await params).collegeId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
export const DELETE = route(
  { auth: "public", publicReason: "Link or form opened without an account (token, slug or anonymous report); the handler validates the token or input and is rate limited per address.", rateLimit: { limit: 3000, windowMs: 60_000 } },
  ({ request, params }) => handleDELETE(request as Parameters<typeof handleDELETE>[0], { params: Promise.resolve(params) } as Parameters<typeof handleDELETE>[1]),
);
