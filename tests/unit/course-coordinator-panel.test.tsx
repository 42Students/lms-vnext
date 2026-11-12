import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock("@/hooks/use-guarded-action", () => ({
  useGuardedAction: () => ({ pending: false, run: vi.fn() }),
}));
vi.mock("@/lib/api-fetch", () => ({
  apiFetch: vi.fn(),
  FriendlyFetchError: class extends Error {},
}));

import {
  AdminOfferingCoordinatorPanel,
  type CoordinatorPanelData,
} from "@/components/courses/admin-offering-coordinator-panel";
import { coordinatorErrorMessage } from "@/modules/courses/coordinator-copy";

const offeringId = "123e4567-e89b-42d3-a456-426614174000";
const person = { membershipId: "m1", displayName: "Asha Rao", email: "asha@example.test" };
const render = (data: CoordinatorPanelData) =>
  renderToStaticMarkup(<AdminOfferingCoordinatorPanel offeringId={offeringId} data={data} />);

describe("course coordinator panel", () => {
  it("offers only the course's teachers when there is no coordinator", () => {
    const html = render({ coordinator: null, eligible: [person], history: [] });
    expect(html).toContain("Course coordinator");
    expect(html).toContain("Choose a teacher of this course");
    expect(html).toContain("Asha Rao");
    expect(html).toContain("Make coordinator");
    expect(html).not.toContain("Since ");
  });

  it("tells the admin to assign a teacher first when nobody teaches the course", () => {
    const html = render({ coordinator: null, eligible: [], history: [] });
    expect(html).toContain("No teacher is assigned to this course yet");
    expect(html).not.toContain("Make coordinator");
  });

  it("shows the current coordinator as active, with a remove action", () => {
    const html = render({
      coordinator: { ...person, grantedAt: "2026-11-10T08:00:00.000Z", counts: true },
      eligible: [person],
      history: [{ action: "GRANTED", occurredAt: "2026-11-10T08:00:00.000Z", coordinatorName: "Asha Rao" }],
    });
    expect(html).toContain("Asha Rao");
    expect(html).toContain("Active");
    expect(html).toContain("Since ");
    expect(html).toContain("Remove coordinator");
    expect(html).toContain("Made coordinator");
    expect(html).not.toContain("Make coordinator<");
  });

  it("says plainly when the coordinator is paused because they no longer teach the course", () => {
    const html = render({
      coordinator: { ...person, grantedAt: "2026-11-10T08:00:00.000Z", counts: false },
      eligible: [],
      history: [],
    });
    expect(html).toContain("Paused: not teaching this course");
  });

  it("gives plain-language errors without internals", () => {
    for (const code of ["COORDINATOR_ALREADY_ASSIGNED", "COORDINATOR_NOT_ELIGIBLE", "COORDINATOR_NOT_FOUND", "COORDINATOR_STALE_VERSION", null, "SOMETHING_ELSE"]) {
      const message = coordinatorErrorMessage(code);
      expect(message.length).toBeGreaterThan(20);
      expect(message).not.toMatch(/COORDINATOR_|uuid|sql|stack/i);
    }
  });
});
