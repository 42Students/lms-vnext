import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("Learner contacts persisted write and UI route contracts", () => {
  it("only exposes a confirmed contact-edit dialog, leaving login credentials alone", () => {
    const ui = read("src/components/profile/learner-profile-workspace.tsx");
    expect(ui).toContain("Edit contact details");
    expect(ui).toContain("FriendlyFetchError");
    expect(ui).toContain("Confirm contact details");
    expect(ui).toContain("Keep current details");
    expect(ui).toContain("learnerContactEditSchema.safeParse");
    expect(ui).toContain('apiFetch<{contacts:LearnerProfileDocument["contacts"]}>("/api/profile/me/contacts"');
    expect(ui).toContain('method: "PATCH"');
    expect(ui).toContain("sm:grid-cols-2");
    expect(ui).toContain('role="alert"');
    expect(ui).toContain("Your login phone and account email will not change");
    expect(ui).toContain("setContactPending(true)");
    expect(ui).toContain("setDetailsDraft(current =>");
  });

  it("enforces strict Zod, same origin, live college/role/user and transactional audit", () => {
    const route = read("src/app/api/profile/me/contacts/route.ts");
    const model = read("src/modules/people/learner-contact-model.ts");
    const service = read("src/modules/people/learner-contact-service.ts");
    expect(route).toContain("isSameOriginRequest(request)");
    expect(route).toContain("updateOwnLearnerContacts");
    expect(model).toContain(".strict()");
    expect(model).toContain("confirmed: z.literal(true)");
    expect(service).toContain('can(context, "profile.self.manage"');
    expect(service).toContain('eq(membershipRoles.role, "LEARNER")');
    expect(service).toContain('owner.userId !== context.user.id');
    expect(service).toContain("jsonb_set(");
    expect(service).toContain("recordActivityEventInTransaction");
    expect(service).toContain("IDENTITY_LEARNER_CONTACT_UPDATED");
    expect(service).not.toContain("metadata: { contacts:");
  });
});
