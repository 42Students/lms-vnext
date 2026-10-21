import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { searchSections } from "@/modules/academics/section-service";

export const runtime = "nodejs";

const querySchema = z.object({
  q: z.string().trim().max(100).default(""),
  programId: z.string().uuid().optional(),
  limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
}).strict();

/** Read-only legacy autocomplete, never refresh or write. */
export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  if ([...searchParams.keys()].some(key => searchParams.getAll(key).length !== 1)) {
    return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
  }
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400 });
  try {
    const context = await getCurrentRequestContext();
    const classes = await searchSections(context, parsed.data);
    return NextResponse.json({ classes });
  } catch (error) { return apiErrorResponse(error); }
}
