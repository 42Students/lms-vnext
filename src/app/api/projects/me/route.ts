import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { apiErrorResponse } from "@/lib/api-error";
import {
  listMyProjectInstances,
} from "@/modules/projects/member-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "actor-owned" },
  async ({ context: actor }) => {
    const context = actor!;
    const projects =
      await listMyProjectInstances(context);
    return NextResponse.json({ projects });
  },
);
