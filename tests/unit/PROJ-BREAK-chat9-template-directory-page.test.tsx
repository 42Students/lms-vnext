import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import SuperAdminProjectTemplatesPage from "@/app/(authenticated)/admin/projects/templates/page";

const state = vi.hoisted(() => ({
  allowRead: true,
  failRead: false,
  directoryCalls: 0,
}));

vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: async () => ({
    user: { id: "a", identityUid: "u", platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
    membership: null, adminScope: null,
  }),
}));
vi.mock("@/modules/permissions/policy", () => ({
  can: () => state.allowRead,
}));
vi.mock("@/modules/projects/super-admin-template-directory-service", () => ({
  listSuperAdminTemplateDirectory: async (_actor: unknown, query: Record<string, unknown>) => {
    state.directoryCalls += 1;
    if (state.failRead) throw new Error("DB_CONN_SENSITIVE_INTERNAL_ERROR");
    return {
      query,
      items: [],
      total: 0,
      totalPages: 1,
      assignmentScope: "GLOBAL",
    };
  },
}));

/** Inspect the server-rendered React element tree, including recovery actions,
 * without evaluating unrelated client controls or the Next router. */
function visibleProps(node: unknown): string[] {
  if (node == null || typeof node === "boolean") return [];
  if (typeof node === "string" || typeof node === "number") return [String(node)];
  if (Array.isArray(node)) return node.flatMap(visibleProps);
  if (!isValidElement(node)) return [];
  const props = node.props as Record<string, unknown>;
  return Object.entries(props).flatMap(([key, value]) =>
    ["children", "title", "description", "href", "action", "eyebrow"].includes(key)
      ? visibleProps(value)
      : [],
  );
}

beforeEach(() => {
  state.allowRead = true;
  state.failRead = false;
  state.directoryCalls = 0;
});

describe("Super Admin Projects template directory graceful page states", () => {
  it("PROJ-BREAK-ux-30 denied or disabled permission never reads template records", async () => {
    state.allowRead = false;
    const tree = await SuperAdminProjectTemplatesPage({ searchParams: Promise.resolve({}) });
    const content = visibleProps(tree).join(" ");
    expect(content).toContain("Project templates access denied");
    expect(content).toContain("Return to dashboard");
    expect(content).toContain("/dashboard");
    expect(state.directoryCalls).toBe(0);
  });

  it("PROJ-BREAK-ux-31 DB outage displays a recoverable view, never internal error codes", async () => {
    state.failRead = true;
    const tree = await SuperAdminProjectTemplatesPage({
      searchParams: Promise.resolve({ q: "IIT Dharwad", status: "PUBLISHED", page: "2" }),
    });
    const content = visibleProps(tree).join(" ");
    expect(content).toContain("Project templates unavailable");
    expect(content).toContain("Retry loading templates");
    expect(content).toContain("search and status filters are unchanged");
    expect(content).toContain("/admin/projects/templates?q=IIT+Dharwad&status=PUBLISHED&page=2");
    expect(content).not.toContain("DB_CONN_SENSITIVE_INTERNAL_ERROR");
    expect(state.directoryCalls).toBe(1);
  });

  it("PROJ-BREAK-templates-108 duplicate and unknown filter keys cannot silently expand template query",async()=>{
    for(const raw of [
      {q:["own","other"]},{status:["PUBLISHED","ARCHIVED"]},
      {page:["1","2"]},{collegeId:"other-tenant"},
      {q:"Dharwad",sort:"secret"},
    ]){
      const tree=await SuperAdminProjectTemplatesPage({searchParams:Promise.resolve(raw)});
      const content=visibleProps(tree).join(" ");
      expect(content).toContain("Invalid template filters");
      expect(content).toContain("Clear filters");
      expect(state.directoryCalls).toBe(0);
    }
  });

  it("PROJ-BREAK-ux-32 malformed query shows reset without touching directory service", async () => {
    const tree = await SuperAdminProjectTemplatesPage({
      searchParams: Promise.resolve({ status: "ACTIVATED", page: "-99" }),
    });
    const content = visibleProps(tree).join(" ");
    expect(content).toContain("Invalid template filters");
    expect(content).toContain("Clear filters");
    expect(state.directoryCalls).toBe(0);
  });

  it("PROJ-BREAK-ux-33 valid empty catalogue uses the correct empty state", async () => {
    const tree = await SuperAdminProjectTemplatesPage({ searchParams: Promise.resolve({}) });
    const content = visibleProps(tree).join(" ");
    expect(content).toContain("No matching templates");
    expect(content).not.toContain("Project templates unavailable");
    expect(state.directoryCalls).toBe(1);
  });
});
