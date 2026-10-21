import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { CollegeElectiveSlotMutationError, updateCollegeElectiveSlot } from "@/modules/electives/college-slot-mutation-service";
import { getSuperAdminElectiveSlotDetail } from "@/modules/electives/admin-directory-service";

export const runtime = "nodejs";

/** Old GET admin/slots/{id}: full selected-slot panel for an explicitly
 * acting-college-scoped global administrator; College Admin continues through
 * /offerings, retaining its membership-checked choices and mutations.
 */
export async function GET(_request:Request,{params}:{params:Promise<{slotId:string}>}){
  try{
    const context=await getCurrentRequestContext();
    const {slotId}=await params;
    const detail=await getSuperAdminElectiveSlotDetail(context,slotId);
    if(!detail)return NextResponse.json({error:"ELECTIVE_SLOT_NOT_FOUND"},{status:404});
    return NextResponse.json({status:"OK",data:detail,...detail},
      {headers:{"Cache-Control":"private, no-store"}});
  }catch(error){return apiErrorResponse(error);}
}


export async function PATCH(request: Request, { params }: {
  params: Promise<{ slotId: string }>;
}) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403 });
  }
  try {
    const context = await getCurrentRequestContext();
    const { slotId } = await params;
    const body: unknown = await request.json();
    const result = await updateCollegeElectiveSlot(context, slotId, body);
    return NextResponse.json({ slot: result });
  } catch (error) {
    if (error instanceof CollegeElectiveSlotMutationError) {
      return NextResponse.json({ error: error.code }, {
        status: error.code === "ELECTIVE_SLOT_NOT_FOUND" ? 404 : 409,
      });
    }
    return apiErrorResponse(error);
  }
}
