import { describe, expect, it } from "vitest";
import {
  placementCompanyApplicantShares, placementCompanyApplicantShareViews,
} from "@/db/schema/placement-company-shares";

describe("staged employer-sharing schema", () => {
  it("isolates hashed capability and view audit in separate scoped tables", () => {
    expect(placementCompanyApplicantShares.id.name).toBe("id");
    expect(placementCompanyApplicantShares.tokenHash.name).toBe("token_hash");
    expect(placementCompanyApplicantShares.collegeId.name).toBe("college_id");
    expect(placementCompanyApplicantShareViews.eventKind.name).toBe("event_kind");
    expect(placementCompanyApplicantShareViews.shareId.name).toBe("share_id");
  });
});
