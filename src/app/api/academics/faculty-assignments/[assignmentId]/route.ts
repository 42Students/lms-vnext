import { route } from "@/security/route";
import { NextResponse } from "next/server";
import {
  endSectionFacultyAssignment,
} from "@/modules/academics/faculty-assignment-service";

export const runtime = "nodejs";

export const DELETE = route(
  { auth: "user", permission: "academics.manage" },
  async ({ context: actor, params }) => {
    const context = actor!;
    const { assignmentId } = params;
    const assignment =
      await endSectionFacultyAssignment(
        context,
        assignmentId,
      );
    return NextResponse.json({ assignment });
  },
);
