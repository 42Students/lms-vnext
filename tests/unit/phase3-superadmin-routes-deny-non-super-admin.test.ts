import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getCurrentRequestContext } from "@/auth/request-context";
import { SessionAuthenticationError } from "@/auth/session";

vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: vi.fn(() => true) }));

/** Every query resolves to an empty result, so an unguarded route can only answer 2xx by letting the caller in. */
function stub(): unknown {
  return new Proxy(function () {}, {
    get(_t, prop) {
      if (prop === "then") return (resolve: (v: unknown) => unknown) => resolve([]);
      if (prop === "transaction") return (fn: (tx: unknown) => unknown) => fn(stub());
      if (prop === "execute") return async () => ({ rows: [] });
      if (prop === Symbol.toPrimitive) return () => "";
      return stub();
    },
    apply() {
      return stub();
    },
  });
}
vi.mock("@/db/client", () => ({
  getDb: () => stub(),
  checkDatabaseConnection: async () => true,
  closeDatabaseConnection: async () => undefined,
}));

const UUID = "33333333-3333-4333-8333-333333333333";
const ORG = "11111111-1111-4111-8111-111111111111";
const COLLEGE = "22222222-2222-4222-8222-222222222222";
type Handler = (request: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response> | Response;

const user = (over: Record<string, unknown> = {}) => ({
  id: UUID,
  identityUid: "uid-phase3",
  platformStatus: "ACTIVE",
  systemRoles: [] as string[],
  ...over,
});
const membership = (role: string) => ({
  id: UUID,
  collegeId: COLLEGE,
  organizationId: ORG,
  status: "ACTIVE",
  roles: [role],
});

const IDENTITIES: Record<string, unknown> = {
  LEARNER: { user: user(), membership: membership("LEARNER"), adminScope: null },
  FACULTY: { user: user(), membership: membership("FACULTY"), adminScope: null },
  COLLEGE_ADMIN: { user: user(), membership: membership("COLLEGE_ADMIN"), adminScope: null },
  MENTOR: { user: user(), membership: membership("MENTOR"), adminScope: null },
  TPO: { user: user(), membership: membership("TPO"), adminScope: null },
  RECRUITER: {
    user: user(),
    membership: null,
    adminScope: null,
    recruiter: { userId: UUID, companyId: UUID, companyName: "Co", title: null, status: "ACTIVE", grants: [] },
  },
  SUSPENDED_SUPER_ADMIN: {
    user: user({ platformStatus: "SUSPENDED", systemRoles: ["SUPER_ADMIN"] }),
    membership: null,
    adminScope: { organizationId: ORG, collegeId: COLLEGE },
  },
};

const loaders = import.meta.glob("../../src/app/api/{admin,organizations,tenant-domains,features}/**/route.ts");
const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

/**
 * Routes that may legitimately answer specific non-Super-Admin identities.
 * The exception names the identities, so any other identity still must be refused.
 */
const MEMBERS = ["LEARNER", "FACULTY", "COLLEGE_ADMIN", "MENTOR", "TPO"];
const ACADEMICS_READ_REASON =
  "Shared academics directory export: the service resolves the acting college with resolveActingCollege(context,'academics.read'), so a College Admin only receives their own college.";
const OPEN_TO_OTHERS: Record<string, { identities: string[]; reason: string }> = {
  "features/me/route.ts": {
    identities: MEMBERS,
    reason:
      "Legacy GET features/me returns only the signed-in principal's own module flags; it accepts no caller college or role override and is meant for every authenticated member.",
  },
  "admin/batches/export/route.ts": { identities: ["COLLEGE_ADMIN"], reason: ACADEMICS_READ_REASON },
  "admin/classes/export/route.ts": { identities: ["COLLEGE_ADMIN"], reason: ACADEMICS_READ_REASON },
  "admin/semesters/export/route.ts": { identities: ["COLLEGE_ADMIN"], reason: ACADEMICS_READ_REASON },
  "admin/semester-courses/export/route.ts": { identities: ["COLLEGE_ADMIN"], reason: ACADEMICS_READ_REASON },
};

function requestFor(method: string) {
  const url = `https://platform.test/api/probe?collegeId=${COLLEGE}&organizationId=${ORG}&host=probe.test&page=1`;
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json", origin: "https://platform.test" },
    body: method === "GET" ? undefined : "{}",
  });
}
const params = () =>
  Promise.resolve(new Proxy({}, { get: () => UUID }) as Record<string, string>);

async function probe(handler: Handler, method: string) {
  try {
    const response = await handler(requestFor(method), { params: params() });
    return { status: response.status };
  } catch {
    // A thrown error never reaches the caller as a success response.
    return { status: 500 };
  }
}

describe("Phase 3: Super Admin API routes refuse every non-Super-Admin identity", () => {
  beforeEach(() => {
    vi.mocked(getCurrentRequestContext).mockReset();
  });

  it("discovers the admin and platform routes", () => {
    expect(Object.keys(loaders).length).toBeGreaterThan(100);
  });

  for (const [name, context] of Object.entries(IDENTITIES)) {
    it(`${name} never receives a success response from any admin or platform route`, async () => {
      vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
      const offenders: string[] = [];
      for (const [file, load] of Object.entries(loaders)) {
        const route = file.replace("../../src/app/api/", "");
        if (OPEN_TO_OTHERS[route]?.identities.includes(name)) continue;
        const mod = (await load()) as Record<string, unknown>;
        for (const method of METHODS) {
          const handler = mod[method] as Handler | undefined;
          if (typeof handler !== "function") continue;
          const { status } = await probe(handler, method);
          if (status >= 200 && status < 400) offenders.push(`${method} ${route} -> ${status}`);
        }
      }
      expect(offenders, `${name} got a success response from: ${offenders.join("; ")}`).toEqual([]);
    }, 280_000);
  }

  it("an unauthenticated caller is turned away with 401 or 403 where the route uses the shared error mapper", async () => {
    vi.mocked(getCurrentRequestContext).mockRejectedValue(new SessionAuthenticationError("SESSION_INVALID"));
    const bad: string[] = [];
    let checked = 0;
    for (const [file, load] of Object.entries(loaders)) {
      const route = file.replace("../../src/app/api/", "");
      const mod = (await load()) as Record<string, unknown>;
      for (const method of METHODS) {
        const handler = mod[method] as Handler | undefined;
        if (typeof handler !== "function") continue;
        const { status } = await probe(handler, method);
        checked++;
        if (status >= 200 && status < 400) bad.push(`${method} ${route} -> ${status}`);
      }
    }
    expect(checked).toBeGreaterThan(100);
    expect(bad, bad.join("; ")).toEqual([]);
  }, 280_000);

  it("every allow-list entry names a real route, known identities and a written reason", () => {
    for (const [route, { identities, reason }] of Object.entries(OPEN_TO_OTHERS)) {
      expect(reason.length, `${route} needs a written reason`).toBeGreaterThan(20);
      expect(Object.keys(loaders).some((f) => f.endsWith(route)), `${route} no longer exists`).toBe(true);
      for (const id of identities) expect(IDENTITIES, `unknown identity ${id}`).toHaveProperty(id);
      expect(identities, `${route} must never excuse SUSPENDED_SUPER_ADMIN, RECRUITER or anonymous callers`).not.toContain("SUSPENDED_SUPER_ADMIN");
      expect(identities).not.toContain("RECRUITER");
    }
  });
});
