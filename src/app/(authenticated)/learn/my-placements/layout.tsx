import type { ReactNode } from "react";
import { LearnerPlacementsTabs } from "@/components/placements/learner-placements-tabs";

export default function LearnerPlacementsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-6">
      <LearnerPlacementsTabs />
      {children}
    </div>
  );
}
