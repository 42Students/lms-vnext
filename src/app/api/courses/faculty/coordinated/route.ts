import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { listMyCoordinatedOfferings } from "@/modules/courses/coordinator-service";

import { ROLE } from "@/modules/identity/roles";
export const runtime = "nodejs";

/** Faculty: the courses this teacher currently coordinates (their own grants only). Other roles get 403. */
export const GET = route(
  { auth: "user", permission: "courses.read" },
  async ({ context: actor }) => {
    const context = actor!;
    if (!hasMembershipRole(context, ROLE.FACULTY)) throw new AuthorizationError("courses.read");
    const offerings = await listMyCoordinatedOfferings(context);
    return NextResponse.json({ offerings });
  },
);
