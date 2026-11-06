import { NextResponse } from "next/server";
import { z } from "zod";
import { route } from "@/security/route";
import {
  createCohort,
  listCohorts,
} from "@/modules/academics/cohort-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context, query }) => {
    const cohorts = await listCohorts(context!, query.programId ?? "");
    return NextResponse.json({ cohorts });
  },
);

export const POST = route(
  // The cohort service validates the body shape; the wrapper bounds its size and requires JSON.
  { auth: "user", permission: "service-enforced", body: { schema: z.unknown(), maxBytes: 16_384 } },
  async ({ context, body }) => {
    const cohort = await createCohort(context!, body);
    return NextResponse.json({ cohort }, { status: 201 });
  },
);
