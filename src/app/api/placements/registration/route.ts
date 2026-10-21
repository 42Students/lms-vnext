import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { getOwnLearnerRegistration } from "@/modules/placements/learner-registration-read-service";
import { requireLearnerPlacementAccess } from "@/modules/placements/learner-participation-guard";
import {
  PlacementRegistrationError, registerOwnPlacementChoice,
} from "@/modules/placements/batch-registration-service";
export const runtime="nodejs";
export async function GET() {
  try {
    return NextResponse.json({registration:await getOwnLearnerRegistration(
      await getCurrentRequestContext(),
    )},{headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {return registrationError(error);}
}
export async function POST(request:Request) {
  if (!isSameOriginRequest(request))
    return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
  try {
    const context=await getCurrentRequestContext();
    await requireLearnerPlacementAccess(context);
    const result=await registerOwnPlacementChoice(context,await request.json());
    return NextResponse.json({ok:true,choice:result.choice,version:result.version},
      {headers:{"Cache-Control":"private, no-store"}});
  } catch (error) {return registrationError(error);}
}
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
