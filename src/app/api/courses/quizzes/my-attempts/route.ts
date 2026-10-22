import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import { listOwnQuizAttemptHistory } from "@/modules/courses/learner-quiz-attempt-history-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

/** Historic /my-submissions is now a membership-scoped all-quiz index.
 * Never accept caller-selected learner IDs, raw numeric quiz IDs or colleges. */
export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams;
    if ([...query.keys()].some(key => key !== "page" && key !== "size") ||
        ["page", "size"].some(key => query.getAll(key).length > 1)) {
      return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400, headers });
    }
    const rawPage = query.get("page") ?? "1";
    const rawSize = query.get("size") ?? "25";
    if (!/^[1-9][0-9]{0,3}$/.test(rawPage) ||
        !/^[1-9][0-9]{0,2}$/.test(rawSize) ||
        Number(rawPage) > 1000 || Number(rawSize) > 100) {
      return NextResponse.json({ error: "INVALID_FILTERS" }, { status: 400, headers });
    }
    const result = await listOwnQuizAttemptHistory(
      await getCurrentRequestContext(), {
        page: Number(rawPage), size: Number(rawSize),
      },
    );
    return NextResponse.json({ ...result, items: result.attempts }, { headers });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
