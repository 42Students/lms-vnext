import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { isSameOriginRequest } from "@/auth/origin";
import { apiErrorResponse } from "@/lib/api-error";
import { readBoundedJsonBody } from "@/lib/bounded-json-body";
import { CollegeElectiveSlotMutationError, createCollegeElectiveSlot, listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";

export const runtime = "nodejs";
/** Old /api/v1/electives/admin/slots is now scoped to the selected college
 * and available at /api/academics/elective-slots; subsequent edits use
 * PATCH /api/academics/elective-slots/{slotId}. Archive is a separate
 * version-checked lifecycle action, not a hidden delete from this endpoint.
 */
export const GET = route(
  { auth: "user", permission: "service-enforced" },
  async ({ context: actor }) => {
    const context = actor!;
    const options=await listCollegeElectiveSlotOptions(context);
    return NextResponse.json({
   ...options,
   navigation:{page:"/college/electives",
    create:"/api/academics/elective-slots",
    edit:"/api/academics/elective-slots/{slotId}",
    archive:"/college/electives"},
   selectedCollegeRequired:true,
   legacyRoute:"/api/v1/electives/admin/slots",
  },{headers:{"Cache-Control":"private, no-store"}});
  },
);

export const POST = route(
  { auth: "user", permission: "service-enforced" },
  async ({ request, context: actor }) => {
    const context = actor!;
    const parsed = await readBoundedJsonBody(request, 16_384);
    if (parsed.kind !== "OK") return NextResponse.json({ error: "INVALID_REQUEST" }, {
      status: parsed.kind === "TOO_LARGE" ? 413 : 400,
      headers: { "Cache-Control": "private, no-store" },
    });
    const body: unknown = parsed.value;
    const result = await createCollegeElectiveSlot(context, body);
    const options = await listCollegeElectiveSlotOptions(context);
    const program = options.programs.find(item => item.id === result.programId);
    const period = options.periods.find(item => item.id === result.academicPeriodId);
    return NextResponse.json({
      slot: { ...result, programName: program?.name ?? null,
        academicPeriodName: period?.name ?? null },
      message: "Elective slot created",
      status:"success",
      pageHref:"/college/electives",
      editHref:"/api/academics/elective-slots/"+result.id,
    }, { status: 201 });
  },
);
