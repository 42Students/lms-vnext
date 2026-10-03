import { describe, expect, it } from "vitest";
import { postgresConstraintName } from "@/modules/academics/errors";

describe("academics PostgreSQL error helpers", () => {
  it("reads direct PostgreSQL constraint names", () => {
    expect(
      postgresConstraintName({
        constraint: "direct_constraint",
      }),
    ).toBe("direct_constraint");
  });

  it("unwraps Drizzle query errors to the PostgreSQL cause", () => {
    expect(
      postgresConstraintName({
        name: "DrizzleQueryError",
        cause: {
          constraint:
            "learner_program_enrollments_active_membership_uq",
        },
      }),
    ).toBe(
      "learner_program_enrollments_active_membership_uq",
    );
  });

  it("fails closed for unrelated errors", () => {
    expect(
      postgresConstraintName(new Error("boom")),
    ).toBeNull();
  });
});
