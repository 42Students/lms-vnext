import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { searchCollegeBatchAutocomplete,recordCollegeBatchSearchSelection } from "@/modules/academics/college-academic-directory-service";

export const runtime = "nodejs";
const schema = z.object({
  q: z.string().trim().max(100).default(""),
  limit: z.string().regex(/^\d{1,2}$/).transform(Number).pipe(z.number().int().min(1).max(50)).optional(),
}).strict();

export async function GET(request: Request) {
  const url = new URL(request.url);
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

/** Selection analytics never trust a client college ID, and are recorded only
 * for a cohort within the requester's persisted selected college. */
export async function POST(request:Request){
 if(!isSameOriginRequest(request))
  return NextResponse.json({error:"INVALID_ORIGIN"},{status:403});
 try{
  const raw:unknown=await request.json().catch(()=>null);
  const parsed=z.strictObject({batchId:z.string().uuid()}).safeParse(raw);
  if(!parsed.success)return NextResponse.json({error:"INVALID_REQUEST"},{status:400});
  return NextResponse.json(await recordCollegeBatchSearchSelection(
    await getCurrentRequestContext(),parsed.data.batchId),{
      headers:{"Cache-Control":"private, no-store"}});
 }catch(error){return apiErrorResponse(error);}
}
