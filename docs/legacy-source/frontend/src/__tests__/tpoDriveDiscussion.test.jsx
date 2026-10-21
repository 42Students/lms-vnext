/**
 * Recruiter phase 1, N7 + Team module V1: a drive's Discussion keeps the talk with the company apart from the placement team's own,
 * and the team's one is the drive's Team conversation, shown in place (one store, two doors).
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import DiscussionTab from "@/components/tpo/drive/DiscussionTab";

jest.mock("react-redux", () => ({ useSelector: (pick) => pick({ loginUser: { id: 12 } }) }));
jest.mock("@/components/tpo/MessagesPanel", () => function MockMessages() { return <div>company thread</div>; });
jest.mock("@/components/tpo/team/TeamConversation", () => function MockTeam({ about, embedded }) {
  return <div>team conversation about {about.kind} {about.key} {embedded ? "embedded" : ""}</div>;
});
jest.mock("@/components/tpo/team/useTeamPeople", () => () => ({ people: [], meId: 12 }));
jest.mock("@/api/Services/TpoHubService", () => ({ getTeamThreads: jest.fn(() => Promise.resolve({ data: [{ id: 3, kind: "DRIVE", aboutKey: "5", unread: 3 }] })) }));

test("with a recruiter on the drive it opens on the company thread, and the team's conversation (with its new count) is a switch away", async () => {
  render(<DiscussionTab job={{ id: 5, recruiterId: 9, companyName: "Omega" }} />);
  expect(screen.getByText("company thread")).toBeInTheDocument();
  fireEvent.click(await screen.findByText("Team (3 new)"));
  expect(screen.getByText("team conversation about DRIVE 5 embedded")).toBeInTheDocument();
});

test("with no recruiter it opens on the team's conversation; an old link asking for the internal notes lands there too", () => {
  render(<DiscussionTab job={{ id: 5, recruiterId: null, companyName: "Omega" }} initial="internal" />);
  expect(screen.getByText("team conversation about DRIVE 5 embedded")).toBeInTheDocument();
});
