import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { tpoMessagingApiErrorResponse } from "@/lib/tpo-messaging-api-error";
import {
  listThreadMessages,
  sendThreadMessage,
} from "@/modules/placements/tpo-messaging-service";

export const runtime = "nodejs";
type RouteContext = {
  params: Promise<{ threadId: string }>;
};

function gated() {
  return process.env.DB09_TPO_API_READY !== "DB09_VERIFIED";
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  if (gated()) {
    return NextResponse.json(
      { error: "DB09_MIGRATIONS_PENDING" },
      { status: 503 },
    );
  }
  try {
    const context = await getCurrentRequestContext();
    const { threadId } = await params;
    return NextResponse.json({
      messages: await listThreadMessages(context, threadId),
    });
  } catch (error) {
    return tpoMessagingApiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
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
    const { threadId } = await params;
    const body = (await request.json()) as { body?: string };
    const message = await sendThreadMessage(
      context,
      threadId,
      body.body ?? "",
    );
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return tpoMessagingApiErrorResponse(error);
  }
}
