import { notFound } from "next/navigation";
import { LearnerPlacementJourneyHarness } from "./learner-placement-journey-harness";

export const dynamic = "force-dynamic";

/** Development-only synthetic UX fixture. Never reads a learner or placement record. */
export default function LearnerPlacementJourneyFixture() {
  if (process.env.NODE_ENV !== "development" ||
      process.env.E2E_AUTH_ENABLED !== "true") notFound();
  return <LearnerPlacementJourneyHarness />;
}
