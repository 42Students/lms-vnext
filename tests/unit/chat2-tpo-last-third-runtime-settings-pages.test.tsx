import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const state = vi.hoisted(() => ({
  roleAllowed: true,
  context: vi.fn(),
  team: vi.fn(),
  publicLink: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error("NEXT_REDIRECT:" + path); },
}));
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children }: {href:string;children:import("react").ReactNode}) =>
      createElement("a", {href}, children),
  };
});
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: state.context,
}));
vi.mock("@/modules/identity/context", () => ({
  hasMembershipRole: (_context: unknown, requested: string) =>
    state.roleAllowed && requested === "TPO",
}));
vi.mock("@/modules/placements/tpo-settings-people-service", () => ({
  getTpoPlacementTeam: state.team,
}));
vi.mock("@/modules/placements/tpo-public-join-link-service", () => ({
  getTpoPublicJoinLinkStatus: state.publicLink,
}));
vi.mock("@/components/tpo/tpo-public-join-link-card", async () => {
  const { createElement } = await import("react");
  return {
    TpoPublicJoinLinkCard: ({initial,scope}:{initial:{ready:boolean};scope:string}) =>
      createElement("section", {"data-scope":scope,role:"status"},
        initial.ready ? "Join link status ready" : "Couldn't load the public link"),
  };
});

import TpoPlacementTeamPage from "@/app/(authenticated)/tpo/settings/team/page";
import TpoRecruiterPublicLinkPage from "@/app/(authenticated)/tpo/settings/public-link/page";

const collegeId = "11111111-1111-4111-8111-111111111111";
const memberId = "22222222-2222-4222-8222-222222222222";
const context = { user: {id:memberId}, membership:{collegeId} };
const team = {
  members: [],
  summary: {total:0,tpoMemberships:0,tpoAdmins:0,facultyCoordinators:0,studentCoordinators:0},
  sources: {teamAssignmentsAvailable:true,studentAssignmentsAvailable:true},
};

describe("chat-2 TPO last-third runtime settings pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.roleAllowed = true;
    state.context.mockResolvedValue(context);
    state.team.mockResolvedValue(team);
    state.publicLink.mockResolvedValue({ready:true,link:null,domain:null});
  });

  it("TPO-settings-team-page-01 denies anonymous and wrong-role visits before any college directory read", async () => {
    state.context.mockResolvedValueOnce({...context,membership:null});
    await expect(TpoPlacementTeamPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(state.team).not.toHaveBeenCalled();
    state.roleAllowed = false;
    await expect(TpoPlacementTeamPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(state.team).not.toHaveBeenCalled();
  });

  it("TPO-settings-team-page-02 shows empty state without converting empty rows into source-unavailable", async () => {
    const html = renderToStaticMarkup(await TpoPlacementTeamPage());
    expect(state.team).toHaveBeenCalledWith(context,collegeId);
    expect(html).toContain("Placement Team");
    expect(html).toContain("No matching active TPO or coordinator memberships");
    expect(html).toContain("Distinct active members");
    expect(html).not.toContain("Faculty team assignments unavailable");
    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain("min-h-11");
  });

  it("TPO-settings-team-page-03 preserves partial-source warnings instead of displaying invented zero totals", async () => {
    state.team.mockResolvedValueOnce({
      ...team, sources:{teamAssignmentsAvailable:false,studentAssignmentsAvailable:false},
    });
    const html = renderToStaticMarkup(await TpoPlacementTeamPage());
    expect(html).toContain("Faculty team assignments unavailable");
    expect(html).toContain("student-coordinator assignments are unavailable");
    expect(html).toContain("Unavailable");
    expect(html).toContain("TPO memberships");
  });

  it("TPO-settings-team-page-04 keeps roster PII unrendered and exposes phone labels in the table", async () => {
    state.team.mockResolvedValueOnce({
      ...team,
      members:[{
        membershipId:memberId,displayName:"Coordinator One",email:"private@other.test",
        phone:"+919999999999",roles:["TPO_ADMIN"],status:"ACTIVE",studentDuties:[],
      }],
      summary:{...team.summary,total:1,tpoMemberships:1,tpoAdmins:1},
    });
    const html = renderToStaticMarkup(await TpoPlacementTeamPage());
    expect(html).toContain("Coordinator One");
    expect(html).toContain("Membership status");
    expect(html).toContain("sm:hidden");
    expect(html).not.toContain("private@other.test");
    expect(html).not.toContain("+919999999999");
  });

  it("TPO-settings-public-link-page-01 denies unauthorized actors before reading or exposing a join-link token", async () => {
    state.context.mockResolvedValueOnce({...context,membership:null});
    await expect(TpoRecruiterPublicLinkPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(state.publicLink).not.toHaveBeenCalled();
    state.roleAllowed = false;
    await expect(TpoRecruiterPublicLinkPage()).rejects.toThrow("NEXT_REDIRECT:/dashboard");
    expect(state.publicLink).not.toHaveBeenCalled();
  });

  it("TPO-settings-public-link-page-02 uses COLLEGE scope, legacy wording and safe empty link readiness", async () => {
    const html=renderToStaticMarkup(await TpoRecruiterPublicLinkPage());
    expect(state.publicLink).toHaveBeenCalledWith(context,"COLLEGE");
    expect(html).toContain("Public recruiter link");
    expect(html).toContain("Join link status ready");
    expect(html).toContain('data-scope="COLLEGE"');
    expect(html).toContain("min-h-11");
  });

  it("TPO-settings-public-link-page-03 retains a visible retry signal if link storage is unavailable", async () => {
    state.publicLink.mockResolvedValueOnce({ready:false,link:null,domain:null});
    const html=renderToStaticMarkup(await TpoRecruiterPublicLinkPage());
    expect(html).toContain("Couldn't load the public link");
    expect(html).not.toContain("Join link status ready");
  });

  it("TPO-settings-pages-04 propagate data faults to route error boundaries instead of rendering raw stack traces", async () => {
    state.team.mockRejectedValueOnce(new Error("internal sql password=secret"));
    await expect(TpoPlacementTeamPage()).rejects.toThrow("internal sql password=secret");
    state.publicLink.mockRejectedValueOnce(new Error("internal sql password=secret"));
    await expect(TpoRecruiterPublicLinkPage()).rejects.toThrow("internal sql password=secret");
  });
});
