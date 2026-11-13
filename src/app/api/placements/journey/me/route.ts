import { route } from "@/security/route";
import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { apiErrorResponse } from "@/lib/api-error";
import { getLearnerPlacementJourney } from "@/modules/placements/learner-journey-service";

import { ROLE } from "@/modules/identity/roles";
export const runtime = "nodejs";

export const GET = route(
  { auth: "user", permission: "actor-owned" },
  async ({ context: actor }) => {
    const context = actor!;
    if (!context.membership || !hasMembershipRole(context, ROLE.LEARNER)) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only students have placements" },
        { status: 403 },
      );
    }
    const journey =
      await getLearnerPlacementJourney(
        context,
      );
    const processes=journey.map(item=>({
      applicationId:item.applicationId,
      jobId:item.job.id,
      href:"/learn/my-placements/applications/"+encodeURIComponent(item.applicationId),
      rounds:item.rounds,
    }));
    const schedule=journey.flatMap(item=>
      item.schedule.map(event=>({...event,applicationId:item.applicationId,jobId:item.job.id})));
    const offers=journey.flatMap(item=>
      item.offerHistory.map(offer=>({...offer,jobId:item.job.id})));
    return NextResponse.json({
      journey,
      applications:journey,
      schedule,
      offers,
      processes,
    },{headers:{"Cache-Control":"private, no-store"}});
  },
);
