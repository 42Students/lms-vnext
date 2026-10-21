/**
 * Owner, 19 Oct 2026: Team and Messages were two sidebar items. Now one Messages page with Recruiters | Team tabs, the team list
 * in Settings > People, and old /tpo/team links land in the right place.
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import TpoMessages from "@/pages/tpo/messages";
import { teamRedirect } from "@/pages/tpo/team";
import { tpoNavigationMenu } from "@/common/lists";

const mockRouter = { query: {}, pathname: "/tpo/messages", replace: jest.fn() };
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("react-redux", () => ({ useDispatch: () => jest.fn(), useSelector: (fn) => fn({ loginUser: { id: 1 } }) }));
jest.mock("@/components/tpo/MessagesPanel", () => function MockRecruiterInbox() { return <div>recruiter inbox</div>; });
jest.mock("@/components/tpo/team/TeamConversations", () => function MockTeam() { return <div>team conversations</div>; });
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn(() => Promise.resolve({ success: true, data: { people: [] } })) }));
jest.mock("@/api/Services/TpoHubService", () => ({ getTeamPeople: jest.fn() }));

beforeEach(() => { mockRouter.query = {}; mockRouter.replace.mockClear(); });

test("Messages opens on Recruiters and switches to Team", () => {
  render(<TpoMessages />);
  expect(screen.getByText("recruiter inbox")).toBeInTheDocument();
  fireEvent.click(screen.getByTestId("tpo.messages.tab-team"));
  expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/tpo/messages", query: { tab: "team" } }, undefined, { shallow: true });
});

test("?tab=team shows the team's conversations", () => {
  mockRouter.query = { tab: "team" };
  render(<TpoMessages />);
  expect(screen.getByText("team conversations")).toBeInTheDocument();
  expect(screen.queryByText("recruiter inbox")).not.toBeInTheDocument();
});

test("old Team links keep their place; the People tab goes to Settings", () => {
  expect(teamRedirect({ c: "4", m: "9" })).toEqual({ pathname: "/tpo/messages", query: { tab: "team", c: "4", m: "9" } });
  expect(teamRedirect({ filter: "me" })).toEqual({ pathname: "/tpo/messages", query: { tab: "team", filter: "me" } });
  expect(teamRedirect({ tab: "people" })).toEqual({ pathname: "/tpo/settings", query: { tab: "team" } });
});

test("the sidebar has Messages once and no Team", () => {
  const names = tpoNavigationMenu().map((m) => m.modulename);
  expect(names.filter((n) => n === "Messages")).toHaveLength(1);
  expect(names).not.toContain("Team");
});
