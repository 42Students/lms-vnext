/** On a phone a recruiter gets the same five places as the sidebar, and no Colleges tab. */
import React from "react";
import { render, screen } from "@testing-library/react";
import MobileFooter from "@/components/MobileFooter/MobileFooter";

jest.mock("next/router", () => ({ useRouter: () => ({ pathname: "/recruiter/home", query: {} }) }));
jest.mock("react-redux", () => ({
  useSelector: (selector) => selector({ loginUser: { userType: "RECRUITER", collegeId: 7 }, app: { activeMenuItem: "home" } }),
}));
jest.mock("@/hooks/useNotificationFeed", () => ({ useNotificationFeed: () => ({ data: [] }) }));

test("the HR footer has Today, Drives, Calendar, Messages and Company, and never a Colleges tab", () => {
  render(<MobileFooter id="home" />);
  const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
  const links = Array.from(nav.querySelectorAll("a")).map((a) => [a.getAttribute("aria-label"), a.getAttribute("href")]);
  expect(links).toEqual([
    ["Today", "/recruiter/home"], ["Drives", "/recruiter/drives"], ["Calendar", "/recruiter/calendar"], ["Messages", "/recruiter/messages"], ["Company", "/recruiter/company"],
  ]);
  expect(screen.queryByText("Colleges")).not.toBeInTheDocument();
});
