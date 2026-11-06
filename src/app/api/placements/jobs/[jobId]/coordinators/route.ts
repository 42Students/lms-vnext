import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  assignDriveDayCoordinator,
  listDriveDayCoordinators,
} from "@/modules/placements/drive-day-coordinator-service";

export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    const coordinators =
      await listDriveDayCoordinators(
        context,
        jobId,
      );
    return NextResponse.json({
      coordinators,
    });
  },
);

export const POST = route(
  { auth: "user", permission: "placements.manage" },
  async ({ request, context: actor, params }) => {
    const context = actor!;
    const { jobId } = params;
    let body: Awaited<ReturnType<Request["json"]>>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST" },
        { status: 400 },
      );
    }
    const assignment =
      await assignDriveDayCoordinator(
        context,
        jobId,
        body,
      );
    return NextResponse.json(
      { assignment },
      { status: 201 },
    );
  },
);
