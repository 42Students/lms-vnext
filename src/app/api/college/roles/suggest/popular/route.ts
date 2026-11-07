import { boundedRequestJson } from "@/lib/bounded-request-json";
import { route } from "@/security/route";
import {NextResponse} from "next/server";
import {z} from "zod";
import {getCurrentRequestContext} from "@/auth/request-context";
import {isSameOriginRequest} from "@/auth/origin";
import {apiErrorResponse} from "@/lib/api-error";
import {listPopularFacultyDirectory,recordFacultyDirectorySelection}
 from "@/modules/people/college-role-directory-service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const noStore={"Cache-Control":"private, no-store"};
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: __actor }) => {
    const __ctx = __actor!;
    const items=await listPopularFacultyDirectory(__ctx,10);
    return NextResponse.json({items},{headers:noStore});
  },
);
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: __actor }) => {
    const __ctx = __actor!;
    const raw:unknown=await boundedRequestJson(request);
    const parsed=z.strictObject({facultyMembershipId:z.uuid()}).parse(raw);
    const outcome=await recordFacultyDirectorySelection(
   __ctx,parsed.facultyMembershipId);
    return NextResponse.json(outcome,{headers:noStore});
  },
);
