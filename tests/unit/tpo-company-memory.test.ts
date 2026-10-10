import { describe, expect, it } from "vitest";
import { tpoCompanyKey } from "@/modules/placements/tpo-company-memory-service";

describe("W05 TPO Company Memory grouping", () => {
  it.each([
    ["Infosys", "infosys"],
    [" Infosys Ltd. ", "infosys"],
    ["Infosys Limited", "infosys"],
    ["INFOSYS PRIVATE LIMITED", "infosys"],
    ["Acme Pvt. Ltd.", "acme"],
    ["Acme Corporation", "acme"],
    ["Acme Co", "acme"],
    ["Foo &amp; Bar LLP", "foo & bar"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(tpoCompanyKey(input)).toBe(expected);
  });

  it("does not erase a meaningful one-word company name", () => {
    expect(tpoCompanyKey("Company")).toBe("company");
    expect(tpoCompanyKey("Pvt")).toBe("pvt");
    expect(tpoCompanyKey("")).toBe("");
  });

  it("normalizes punctuation and repeated whitespace without joining words", () => {
    expect(tpoCompanyKey("  A.C.M.E.   Labs Pvt Ltd ")).toBe("a c m e labs");
    expect(tpoCompanyKey("Foo-Bar Inc.")).toBe("foo bar");
  });
});
