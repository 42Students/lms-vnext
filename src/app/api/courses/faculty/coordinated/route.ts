import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listMyCoordinatedOfferings } from "@/modules/courses/coordinator-service";

export const runtime = "nodejs";

/** Faculty: the courses this teacher currently coordinates (their own grants only). Other roles get 403. */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    if (!hasMembershipRole(context, "FACULTY")) throw new AuthorizationError("courses.read");
    const offerings = await listMyCoordinatedOfferings(context);
    return NextResponse.json({ offerings });
  },
);
