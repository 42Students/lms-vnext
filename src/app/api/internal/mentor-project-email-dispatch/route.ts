import { NextResponse } from "next/server";
import { mentorProjectEmailWorkerReady, runMentorProjectEmailDispatchBatch }
  from "@/modules/projects/mentor-project-email-dispatch-worker";
import { internalRoute } from "@/security/internal-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Server-to-server only. No GET, no browser session, no client-chosen job; the worker token is provisioned and rotated separately. */
export const POST = internalRoute(
  {
    name: "internal.mentor-project-email-dispatch",
    credential: { kind: "bearer", secretEnv: "MENTOR_PROJECT_EMAIL_WORKER_TOKEN" },
    emptyBody: true,
    denied: { status: 403, body: { error: "FORBIDDEN" } },
    invalid: { error: "INVALID_REQUEST" },
  },
  async () => {
    if (!mentorProjectEmailWorkerReady().ready) {
      return NextResponse.json({ error: "WORKER_DISABLED" }, { status: 503 });
    }
    try {
      return NextResponse.json(await runMentorProjectEmailDispatchBatch());
    } catch {
      return NextResponse.json({ error: "WORKER_UNAVAILABLE" }, { status: 503 });
    }
  },
);
