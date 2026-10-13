import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

describe("Learner interview detail to reschedule request", () => {
  it("links an authorized interview round to the real reschedule form", () => {
    const details = read("src/components/placements/learner-career-rounds-workspace.tsx");
    expect(details).toContain('kind === "INTERVIEW" && selected');
    expect(details).toContain("encodeURIComponent(selected.roundId)");
    expect(details).toContain("#round-reschedule");
    expect(details).toContain("Request reschedule");
  });

  it("preselects only learner-authorized request rounds", () => {
    const page = read("src/app/(authenticated)/learn/my-placements/page.tsx");
    const requests = read("src/components/placements/learner-placement-requests.tsx");
    expect(page).toContain("initialRoundId={requestRoundId}");
    expect(requests).toContain("rounds.find((round) => round.roundId === initialRoundId)");
    expect(requests).toContain('id="round-reschedule"');
    expect(requests).toContain('"ROUND_RESCHEDULE"');
    expect(requests).toContain('"/api/placements/requests"');
  });
});
