import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { searchCollegeBatchAutocomplete,recordCollegeBatchSearchSelection } from "@/modules/academics/college-academic-directory-service";
import { route } from "@/security/route";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";
const schema = z.object({
  q: z.string().trim().max(100).default(""),
  limit: z.string().regex(/^\d{1,2}$/).transform(Number).pipe(z.number().int().min(1).max(50)).optional(),
}).strict();

async function handleGET(request: Request) {
  const url = new URL(request.url);
  if ([...url.searchParams.keys()].some(key => url.searchParams.getAll(key).length > 1))
    return NextResponse.json({ error: "INVALID_FILTERS" }, {
      status: 400, headers: { "Cache-Control": CACHE.PRIVATE },
    });
  const input = schema.safeParse(Object.fromEntries(url.searchParams));
  if (!input.success) {
    return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
  }
  try {
    const context = await getCurrentRequestContext();
    const items = await searchCollegeBatchAutocomplete(context, input.data.q, input.data.limit);
    return NextResponse.json({ items });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handleGET(request as Parameters<typeof handleGET>[0]),
);

/** Selection analytics never trust a client college ID, and are recorded only
 * for a cohort within the requester's persisted selected college. */
async function handlePOST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const bounded = await readBoundedJsonBody(request, 16_384);
  if (bounded.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
    status: bounded.kind === "TOO_LARGE" ? 413 : 400,
    headers: { "Cache-Control": CACHE.PRIVATE },
  });
  const raw: unknown = bounded.value;
  const parsed=z.strictObject({batchId:z.string().uuid()}).safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return NextResponse.json(await recordCollegeBatchSearchSelection(
    await getCurrentRequestContext(),parsed.data.batchId),{
      headers:{"Cache-Control":CACHE.PRIVATE}});
 }catch(error){return apiErrorResponse(error);}
}
export const POST = route(
  { auth: "user", permission: "service-enforced" },
  ({ request }) => handlePOST(request as Parameters<typeof handlePOST>[0]),
);
