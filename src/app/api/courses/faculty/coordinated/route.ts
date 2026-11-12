import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { listMyCoordinatedOfferings } from "@/modules/courses/coordinator-service";

export const runtime = "nodejs";

/** Faculty: the courses this teacher currently coordinates (their own grants only). */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const offerings = await listMyCoordinatedOfferings(actor!);
    return NextResponse.json({ offerings });
  },
);
