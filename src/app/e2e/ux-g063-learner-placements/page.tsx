import { notFound } from "next/navigation";
import { LearnerPlacementJourneyHarness } from "./learner-placement-journey-harness";

import { featureReady } from "@/config/features";
export const dynamic = "force-dynamic";

/** Development-only synthetic UX fixture. Never reads a learner or placement record. */
export default function LearnerPlacementJourneyFixture() {
  if (process.env.NODE_ENV !== "development" ||
      !featureReady("e2eAuth")) notFound();
  return <LearnerPlacementJourneyHarness />;
}
