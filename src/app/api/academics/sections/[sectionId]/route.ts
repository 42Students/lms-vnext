import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import {
  archiveSection,
  updateSection,
} from "@/modules/academics/section-service";

import { CACHE } from "@/security/responses";
export const runtime = "nodejs";

export const PATCH = route(
  { auth: "user", permission: "academics.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { sectionId } = params;
    const parsedBody = await readBoundedJsonBody(request, 16_384);
    if (parsedBody.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsedBody.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": CACHE.PRIVATE },
    });
    const body = parsedBody.value;
    const section = await updateSection(
      context,
      sectionId,
      body,
    );
    return NextResponse.json({ section });
  },
);

export const DELETE = route(
  { auth: "user", permission: "academics.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { sectionId } = params;
    const section = await archiveSection(
      context,
      sectionId,
    );
    return NextResponse.json({ section });
  },
);
