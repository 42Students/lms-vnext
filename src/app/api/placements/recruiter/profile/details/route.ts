import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {updateOwnRecruiterProfileDetails} from "@/modules/placements/recruiter-profile-details-service";
import {readRecruiterJsonBody,RecruiterJsonBodyError} from "@/modules/placements/recruiter-json-request";
export const runtime="nodejs";
export async function PATCH(request:Request){
 if(!isSameOriginRequest(request))return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await readRecruiterJsonBody(request);
  if(raw===null)return NextResponse.json({error:"BODY_REQUIRED"},{status:400});
  let normalized=raw;
  if(typeof raw==="object"&&raw!==null&&!Array.isArray(raw)){
    const source=raw as Record<string,unknown>;
    // Historic contactMail was mutable; work email is now the immutable
    // verified sign-in identity. Never accept a silent contact-mail rewrite.
    if(Object.hasOwn(source,"contactMail"))
      return NextResponse.json({error:"WORK_EMAIL_LOCKED",
        message:"Work email is locked to your verified sign-in identity."},
        {status:422,headers:{"Cache-Control":"private, no-store"}});
    if(Object.hasOwn(source,"designation")||Object.hasOwn(source,"contactMobile")){
      const {designation,contactMobile,...fields}=source;
      normalized={...fields,
        title:fields.title??designation,
        phone:fields.phone??contactMobile};
    }
  }
  const profile=await updateOwnRecruiterProfileDetails(
    await getCurrentRequestContext(),normalized);
  return NextResponse.json({profile,workEmailEditable:false,
    workEmailHelp:"Work email is linked to your verified sign-in account."},
    {headers:{"Cache-Control":"private, no-store"}});
 }catch(error){if(error instanceof RecruiterJsonBodyError)
  return NextResponse.json({error:"INVALID_REQUEST"},{status:error.kind==="TOO_LARGE"?413:400});
  return apiErrorResponse(error);}
}
