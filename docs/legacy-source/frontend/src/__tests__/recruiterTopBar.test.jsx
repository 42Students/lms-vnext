import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import RecruiterTopBar from "@/components/recruiter/RecruiterTopBar";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush, pathname: "/recruiter/home" }) }));
jest.mock("@/components/recruiter/RecruiterNotificationBell", () => function BellStub() { return <button type="button">bell</button>; });

test("the recruiter header has one action and the bell, and no search or repeated page name", () => {
  render(<RecruiterTopBar />);
  expect(screen.queryByText(/Search/)).not.toBeInTheDocument();
  expect(screen.queryByText("Today")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Request a drive/ }));
  expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/new");
  expect(screen.getByText("bell")).toBeInTheDocument();
});
