import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {readCollegeLogoForm,CollegeLogoRequestError} from "@/modules/colleges/college-logo-request-body";
import {CollegeLogoError,uploadCollegeLogo,getPublicCollegeLogo,removeCollegeLogo} from "@/modules/colleges/admin-branding-logo-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
// The logo uses an explicitly scoped same-origin multipart endpoint as the
// CORS-free fallback for its own PNG type only. Other file categories must
// preserve their own grants/policies, not reuse college branding permissions.
// Upload/removal persists independently of other branding fields; a future
// staged form-save protocol must be coordinated with the branding owner.
type Params={params:Promise<{collegeId:string}>};
export async function POST(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const context=await getCurrentRequestContext();
  const form=await readCollegeLogoForm(request);
  const entries=[...form.keys()];
  if(entries.some(key=>key!=="file")||entries.filter(key=>key==="file").length!==1)
   return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  const result=await uploadCollegeLogo(context,(await params).collegeId,file);
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
export async function GET(_request:Request,{params}:Params){
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

export async function DELETE(request:Request,{params}:Params){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const result=await removeCollegeLogo(await getCurrentRequestContext(),(await params).collegeId);
  return NextResponse.json(result,{headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
