import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SocialProfiles from "@/components/profile/about/socialProfiles";
import { codingProblem, codingUsername, resetChoicesCache, FALLBACK_CHOICES } from "@/hooks/useChoices";
import { studentFilterDefs } from "@/components/tpo/students/studentGridRules";
import { applyFilters } from "@/components/tpo/filters/filterModel";

jest.mock("@/api/Services/ChoicesService", () => ({ getChoices: jest.fn(() => Promise.reject(new Error("offline"))) }));

const leet = FALLBACK_CHOICES.codingPlatforms.find((p) => p.value === "LEETCODE");
const chef = FALLBACK_CHOICES.codingPlatforms.find((p) => p.value === "CODECHEF");

beforeEach(() => resetChoicesCache());

test("a username or the profile link give the same username; another site's link is refused", () => {
  expect(codingUsername(leet, "asha_k")).toBe("asha_k");
  expect(codingUsername(leet, "https://leetcode.com/u/asha_k/")).toBe("asha_k");
  expect(codingUsername(leet, "https://evil.example.com/u/asha_k")).toBeNull();
  expect(codingProblem(leet, "https://evil.example.com/u/asha_k")).toMatch(/not a LeetCode profile/);
  expect(codingProblem(chef, "9abc")).toMatch(/CodeChef username should be/);
  expect(codingProblem(leet, "")).toBe("");
});

test("a student edits coding profiles; the save sends usernames only and a bad one blocks Save", async () => {
  const onUpdate = jest.fn(() => Promise.resolve());
  render(<SocialProfiles social={{}} socialEdit setSocialEdit={() => {}} onUpdate={onUpdate} />);
  fireEvent.change(screen.getByLabelText("LeetCode username"), { target: { value: "https://leetcode.com/u/asha_k" } });
  fireEvent.change(screen.getByLabelText("CodeChef username"), { target: { value: "9bad" } });
  expect(screen.getByText(/CodeChef username should be/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("CodeChef username"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onUpdate).toHaveBeenCalled());
  expect(onUpdate.mock.calls[0][0].codingProfiles).toEqual({ LEETCODE: "asha_k" });
});

test("saved coding profiles show as links; teachers never see the section", () => {
  const social = { codingProfileLinks: [{ key: "LEETCODE", label: "LeetCode", username: "asha_k", url: "https://leetcode.com/u/asha_k" }] };
  const { rerender } = render(<SocialProfiles social={social} socialEdit={false} setSocialEdit={() => {}} onUpdate={() => {}} />);
  expect(screen.getByText("LeetCode: asha_k").closest("a")).toHaveAttribute("href", "https://leetcode.com/u/asha_k");
  rerender(<SocialProfiles social={social} socialEdit={false} setSocialEdit={() => {}} onUpdate={() => {}} isTeacher />);
  expect(screen.queryByText("LeetCode: asha_k")).not.toBeInTheDocument();
});

test("the Students filter has Coding profiles, including students with none", () => {
  const rows = [{ learnerId: 1, codingPlatforms: ["LEETCODE"] }, { learnerId: 2, codingPlatforms: [] }];
  const defs = studentFilterDefs(rows);
  expect(applyFilters(rows, defs, { coding: ["LEETCODE"] }).map((r) => r.learnerId)).toEqual([1]);
  expect(applyFilters(rows, defs, { coding: ["NONE"] }).map((r) => r.learnerId)).toEqual([2]);
});
