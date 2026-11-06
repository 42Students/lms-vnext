import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { BoundedFormDataError, readBoundedFormData } from "@/lib/bounded-form-data";
import { readBoundedUtf8Body } from "@/lib/bounded-utf8-body";
import { getOwnLearnerRegistration } from "@/modules/placements/learner-registration-read-service";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import {
  PlacementRegistrationError, registerOwnPlacementChoice,
} from "@/modules/placements/batch-registration-service";
export const runtime="nodejs";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    try {
const registration=await getOwnLearnerRegistration(__ctx);
return NextResponse.json({registration,data:registration,status:"OK"},
      {headers:{"Cache-Control":"private, no-store"}});
} catch (error) {return registrationError(error);}
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const context = __actor!;
    try {
await requireLearnerPlacementAccess(context);
const mime=request.headers.get("content-type")??"";
let payload:unknown;
if(mime.toLowerCase().includes("application/x-www-form-urlencoded")){
      // Legacy form POSTs use choice and consent; modern UI uses strict JSON.
      let form:FormData;
      try {form=await readBoundedFormData(request,8*1024);}
      catch(error){
        if(!(error instanceof BoundedFormDataError))throw error;
        return NextResponse.json({error:error.code==="BODY_TOO_LARGE"?"REQUEST_TOO_LARGE":"INVALID_REQUEST"},
          {status:error.code==="BODY_TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"}});
      }
      const consent=form.get("acceptedConsent")??form.get("consent");
      payload={choice:form.get("choice"),
        acceptedConsent:consent==="true"||consent==="on"||consent==="1"};
    }else{
      const raw=await readBoundedUtf8Body(request,8*1024);
      if(raw.kind!=="OK")return NextResponse.json({
        error:raw.kind==="TOO_LARGE"?"REQUEST_TOO_LARGE":"INVALID_REQUEST",
      },{status:raw.kind==="TOO_LARGE"?413:400,headers:{"Cache-Control":"private, no-store"}});
      try {payload=JSON.parse(raw.body);}
      catch{return NextResponse.json({error:"INVALID_REQUEST"},{status:400});}
      // Historical JSON bodies used consent, not acceptedConsent. Do not
      // infer consent when the field is omitted or rewrite its version.
      if(payload && typeof payload==="object" && !Array.isArray(payload)){
        const value=payload as Record<string,unknown>;
        if("consent" in value && !("acceptedConsent" in value)){
          const {consent,...rest}=value;
          payload={...rest,acceptedConsent:consent};
        }
      }
    }
const result=await registerOwnPlacementChoice(context,payload);
return NextResponse.json({ok:true,status:"OK",choice:result.choice,version:result.version, data:{choice:result.choice,version:result.version}},
      {headers:{"Cache-Control":"private, no-store"}});
} catch (error) {return registrationError(error);}
  },
);
function registrationError(error:unknown) {
  if (error instanceof PlacementRegistrationError)
    return NextResponse.json({error:error.code},{
      status:error.code==="DB08_REGISTRATION_FORBIDDEN" ||
        error.code==="DB08_REGISTRATION_MODULE_DISABLED"?403:409,
    });
  if (error instanceof Error && (error.message==="DB08_REGISTRATION_CONSENT_REQUIRED" ||
      error.message==="DB08_REGISTRATION_CONSENT_NOT_APPLICABLE"))
    return NextResponse.json({error:error.message},{status:422});
  return apiErrorResponse(error);
}
