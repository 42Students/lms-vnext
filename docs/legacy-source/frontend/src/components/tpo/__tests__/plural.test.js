import { plural } from "../ui/labels";

describe("plural", () => {
  it("never says 1 students", () => {
    expect(plural(1, "student")).toBe("1 student");
    expect(plural(0, "student")).toBe("0 students");
    expect(plural(12, "applicant")).toBe("12 applicants");
    expect(plural(2, "company", "companies")).toBe("2 companies");
  });
});
