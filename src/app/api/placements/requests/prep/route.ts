import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {getCurrentRequestContext} from "@/auth/request-context";
import {apiErrorResponse} from "@/lib/api-error";
import {TpoPrepError,listOwnTpoPrepAssignments} from "@/modules/placements/tpo-prep-assignment-service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    try {
return NextResponse.json({assignments:await listOwnTpoPrepAssignments(__ctx)},
  {headers:{"Cache-Control":"private, no-store"}});
} catch(error){if(error instanceof TpoPrepError)return NextResponse.json({error:error.code},{status:503});
  return apiErrorResponse(error);}
  },
);
