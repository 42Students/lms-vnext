import { NextResponse } from "next/server";
import { isSameOriginRequest } from "@/auth/origin";
import { GET as readSkills, POST as selectSkill } from "@/app/api/skills/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ legacyPath: string[] }> };
const headers = { "Cache-Control": "private, no-store" };

function readMode(parts: string[]) {
  if (parts.length === 1 && ["search", "popular", "categories", "stats"].includes(parts[0]!))
    return { mode: parts[0]!, skillName: null, category: null };
  if (parts.length === 2 && parts[0] === "category" && parts[1])
    return { mode: "category", skillName: null, category: parts[1] };
  if (parts.length === 2 && parts[0] === "exists" && parts[1])
    return { mode: "exists", skillName: parts[1], category: null };
  return null;
}

/** Mounted v2 compatibility path: keep the legacy response shape while using
 * the current authenticated catalog and safe, cache-disabled queries. */
export async function GET(request: Request, { params }: Context) {
  const { legacyPath } = await params;
  const parsed = readMode(legacyPath);
  if (!parsed || legacyPath.some(value => value.length > 200)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers });
  }
  const target = new URL("/api/skills", request.url);
  const source = new URL(request.url).searchParams;
  for (const key of ["query", "limit"]) {
    if (source.getAll(key).length > 1)
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400, headers });
    if (source.has(key)) target.searchParams.set(key, source.get(key)!);
  }
  // A category/name embedded in the path always wins over forged query values.
  target.searchParams.set("mode", parsed.mode);
  target.searchParams.set("compat", "v2");
  if (parsed.category) target.searchParams.set("category", parsed.category);
  if (parsed.skillName) target.searchParams.set("skillName", parsed.skillName);
  return readSkills(new Request(target, { headers: request.headers }));
}

/** Legacy POST /api/v2/skills/{skillName}/select, now same-origin and
 * authenticated. The route never accepts an arbitrary reporter/learner ID. */
export async function POST(request: Request, { params }: Context) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: "INVALID_ORIGIN" }, { status: 403, headers });
  }
  const { legacyPath } = await params;
  if (legacyPath.length !== 2 || legacyPath[1] !== "select" ||
      !legacyPath[0] || legacyPath[0].trim().length > 200) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404, headers });
  }
  const target = new URL("/api/skills", request.url);
  const outcome = await selectSkill(new Request(target, {
    method: "POST",
    headers: { ...Object.fromEntries(request.headers), "content-type": "application/json" },
    body: JSON.stringify({ action: "SELECT_V2", name: legacyPath[0] }),
  }));
  if (!outcome.ok) return outcome;
  return NextResponse.json({ status: "success", message: "Selection recorded", data: null }, { headers });
}
