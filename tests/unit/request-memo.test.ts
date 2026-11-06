import { describe, expect, it } from "vitest";
import { offerRequestValue, runWithTenantHolder, takeRequestValue } from "@/db/tenant-context";

describe("single-use request hand-off", () => {
  it("gives the offered value to the first taker only", async () => {
    await runWithTenantHolder(async () => {
      offerRequestValue("k", { id: 1 });
      expect(takeRequestValue("k")).toEqual({ id: 1 });
      expect(takeRequestValue("k")).toBeUndefined();
    });
  });

  it("does not leak across requests and does nothing outside a holder", async () => {
    await runWithTenantHolder(async () => offerRequestValue("k", "a"));
    await runWithTenantHolder(async () => expect(takeRequestValue("k")).toBeUndefined());
    offerRequestValue("k", "b");
    expect(takeRequestValue("k")).toBeUndefined();
  });
});
