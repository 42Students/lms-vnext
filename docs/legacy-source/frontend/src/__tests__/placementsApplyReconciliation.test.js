import { createReconciledApply } from "@/utils/placementsApplyReconciliation";

const applied = (value) => ({ data: { status: "success", data: { applied: value } } });

describe("placements Apply reconciliation", () => {
  test("returns an authoritative successful response unchanged", async () => {
    const receipt = { data: { status: "success", data: { id: 2 } } };
    const submit = jest.fn().mockResolvedValue(receipt);
    const apply = createReconciledApply({ submit, check: jest.fn() });
    await expect(apply(1, 2, null)).resolves.toBe(receipt);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  test("lost POST response with applied=true reconciles as already applied", async () => {
    const submit = jest.fn().mockRejectedValue(new Error("connection lost"));
    const check = jest.fn().mockResolvedValue(applied(true));
    const apply = createReconciledApply({ submit, check });
    await expect(apply(1, 2, null)).rejects.toMatchObject({ response: { status: 409 } });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledTimes(1);
  });

  test("lost POST response with applied=false never claims nothing was sent", async () => {
    const apply = createReconciledApply({
      submit: jest.fn().mockRejectedValue(new Error("connection lost")),
      check: jest.fn().mockResolvedValue(applied(false)),
    });
    await expect(apply(1, 2)).rejects.toThrow(/follow-up check/i);
  });

  test("an unreadable follow-up blocks any new POST until status is known", async () => {
    const submit = jest.fn().mockRejectedValue(new Error("lost"));
    const check = jest.fn().mockRejectedValue(new Error("offline"));
    const apply = createReconciledApply({ submit, check });
    await expect(apply(1, 2)).rejects.toThrow(/couldn't verify/i);
    await expect(apply(1, 2)).rejects.toThrow(/couldn't verify/i);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  test("malformed successful POST is reconciled; malformed read blocks retry", async () => {
    const submit = jest.fn().mockResolvedValue({ data: {} });
    const check = jest.fn().mockResolvedValue({ data: { status: "success", data: {} } });
    const apply = createReconciledApply({ submit, check });
    await expect(apply(1, 2)).rejects.toThrow(/couldn't verify/i);
    await expect(apply(1, 2)).rejects.toThrow(/couldn't verify/i);
    expect(submit).toHaveBeenCalledTimes(1);
  });

  test("a definite rate limit is not retried or reclassified", async () => {
    const rateLimit = { response: { status: 429, data: { message: "Slow down" } } };
    const check = jest.fn();
    const apply = createReconciledApply({ submit: jest.fn().mockRejectedValue(rateLimit), check });
    await expect(apply(1, 2)).rejects.toBe(rateLimit);
    expect(check).not.toHaveBeenCalled();
  });

  test("parallel clicks cannot initiate a second POST for the same learner and job", async () => {
    let resolve;
    const submit = jest.fn().mockReturnValue(new Promise((done) => { resolve = done; }));
    const apply = createReconciledApply({ submit, check: jest.fn() });
    const first = apply(1, 2);
    await expect(apply(1, 2)).rejects.toThrow(/already in progress/i);
    expect(submit).toHaveBeenCalledTimes(1);
    resolve({ data: { status: "success" } });
    await first;
  });
});
