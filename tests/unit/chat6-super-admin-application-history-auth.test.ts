import { beforeEach, describe, expect, it, vi } from "vitest";
import { getCurrentRequestContext } from "@/auth/request-context";
import { getSuperAdminApplicationDetail } from "@/modules/admin-ui/super-admin-application-detail-service";
import { listSuperAdminApplicationStageHistory } from "@/modules/admin-ui/super-admin-application-stage-history-service";
import SuperAdminApplicationDetail from "@/app/(authenticated)/admin/placements/applications/[applicationId]/page";

vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/modules/admin-ui/super-admin-application-detail-service", () => ({
  getSuperAdminApplicationDetail: vi.fn(),
}));
vi.mock("@/modules/admin-ui/super-admin-application-stage-history-service", () => ({
  listSuperAdminApplicationStageHistory: vi.fn(),
}));
vi.mock("@/components/admin/super-admin-placement-detail-view", () => ({
  SuperAdminPlacementDetailView: () => null,
}));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NEXT_NOT_FOUND"); },
}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const applicationId = "22222222-2222-4222-8222-222222222222";
const context = {
  user: { id: "33333333-3333-4333-8333-333333333333", identityUid: "super",
    platformStatus: "ACTIVE", systemRoles: ["SUPER_ADMIN"] },
  membership: null,
  adminScope: { collegeId, organizationId: "44444444-4444-4444-8444-444444444444" },
};
const params = { params: Promise.resolve({ applicationId }) };

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentRequestContext).mockResolvedValue(context as never);
  vi.mocked(listSuperAdminApplicationStageHistory).mockResolvedValue([] as never);
});

describe("Super Admin middle-third application stage authorization", () => {
  it("SA-admin-middle-application-context-02 reuses the *same* selected-college snapshot for detail and history", async () => {
    vi.mocked(getSuperAdminApplicationDetail).mockResolvedValue({
      title: "Learner", subtitle: "Job", status: "SUBMITTED",
      backHref: "/admin/placements/applications",
      related: { href: "/admin/placements/jobs/55555555-5555-4555-8555-555555555555", label: "Job" },
      facts: [],
    } as never);
    const rendered = await SuperAdminApplicationDetail(params);
    expect(rendered).toBeTruthy();
    expect(getCurrentRequestContext).toHaveBeenCalledOnce();
    expect(getSuperAdminApplicationDetail).toHaveBeenCalledWith(context, applicationId);
    expect(listSuperAdminApplicationStageHistory).toHaveBeenCalledOnce();
    expect(listSuperAdminApplicationStageHistory).toHaveBeenCalledWith(context, applicationId);
  });

  it("SA-admin-middle-application-context-02 a missing or cross-college application never reads private stage history", async () => {
    vi.mocked(getSuperAdminApplicationDetail).mockResolvedValue(null);
    await expect(SuperAdminApplicationDetail(params)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(getCurrentRequestContext).toHaveBeenCalledOnce();
    expect(listSuperAdminApplicationStageHistory).not.toHaveBeenCalled();
  });

  it("SA-admin-middle-application-context-02 denial before detail prevents both reads", async () => {
    vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("SESSION_REVOKED"));
    await expect(SuperAdminApplicationDetail(params)).rejects.toThrow("SESSION_REVOKED");
    expect(getSuperAdminApplicationDetail).not.toHaveBeenCalled();
    expect(listSuperAdminApplicationStageHistory).not.toHaveBeenCalled();
  });
});
