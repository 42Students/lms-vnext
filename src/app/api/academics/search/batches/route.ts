import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { searchCollegeBatchAutocomplete } from "@/modules/academics/college-academic-directory-service";

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
