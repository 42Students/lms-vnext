import { NextResponse } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { apiErrorResponse } from "@/lib/api-error";
import { getLearnerPlacementJourney } from "@/modules/placements/learner-journey-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const context = await getCurrentRequestContext();
    if (!context.membership || !hasMembershipRole(context, "LEARNER")) {
      return NextResponse.json(
        { error: "FORBIDDEN", message: "Only students have placements" },
        { status: 403 },
      );
    }
    const journey =
      await getLearnerPlacementJourney(
        context,
      );
    // V1 LearnerPlacementController crosswalk:
    // GET overview -> /api/placements/overview/me
    // GET journey  -> /api/placements/journey/me (this GET)
    // GET process  -> learner's own application detail, linked per row
    // POST register -> /api/placements/registration (same-origin guarded)
    // The legacy empty response always had applications, schedule and offers
    // as distinct [] values; preserve them without exposing unreleased offers.
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
  } catch (error) {
    return apiErrorResponse(error);
  }
}
