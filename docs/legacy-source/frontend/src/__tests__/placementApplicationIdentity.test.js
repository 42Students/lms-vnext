import {
  findPlacementJourneyByApplicationId,
  getPlacementApplicationId,
} from "@/utils/placementApplicationIdentity";

describe("placement application identity", () => {
  test("reads ids from the learner-application DTO wrapper", () => {
    expect(getPlacementApplicationId({ application: { id: 77 } })).toBe(77);
  });

  test("selects the exact application even when rows share the same job", () => {
    const rows = [
      { application: { id: 11, job: { id: 900 } }, nextInterview: { id: 101 } },
      { application: { id: 22, job: { id: 900 } }, nextInterview: { id: 202 } },
    ];

    expect(findPlacementJourneyByApplicationId(rows, 22)?.nextInterview?.id).toBe(202);
    expect(findPlacementJourneyByApplicationId(rows, 11)?.nextInterview?.id).toBe(101);
  });

  test("fails closed when application identity is missing or invalid", () => {
    expect(findPlacementJourneyByApplicationId([{ job: { id: 900 } }], null)).toBeNull();
    expect(findPlacementJourneyByApplicationId([], "not-an-id")).toBeNull();
  });
});
