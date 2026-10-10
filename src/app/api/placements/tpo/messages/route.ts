import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoMessagingApiErrorResponse } from "@/lib/tpo-messaging-api-error";
import {
  listMessageThreads,
  openTpoMessageThread,
} from "@/modules/placements/tpo-messaging-service";

export const runtime = "nodejs";

function gated() {
  return process.env.DB09_TPO_API_READY !== "DB09_VERIFIED";
}

export async function GET(request: Request) {
  if (gated()) {
    return NextResponse.json(
      { error: "DB09_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const collegeId =
      new URL(request.url).searchParams.get("collegeId") ?? "";
    return NextResponse.json({
      threads: await listMessageThreads(context, collegeId),
    });
  } catch (error) {
    return tpoMessagingApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  if (gated()) {
    return NextResponse.json(
      { error: "DB09_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "INVALID_ORIGIN" },
      { status: 403 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const body = (await request.json()) as {
      collegeId?: string;
      recruiterUserId?: string;
      jobId?: string | null;
    };
    const thread = await openTpoMessageThread(context, {
      collegeId: body.collegeId ?? "",
      recruiterUserId: body.recruiterUserId ?? "",
      jobId: body.jobId ?? null,
    });
    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    return tpoMessagingApiErrorResponse(error);
  }
}
