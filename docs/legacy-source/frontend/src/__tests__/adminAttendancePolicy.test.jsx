import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import PolicySettingField from "@/components/admin/PolicySettingField";
import Api from "@/api/ApiMethod";
import { getCollegeSettings, putCollegeSettings } from "@/api/Services/TenantAdminService";

const mockState = { loginUser: { id: 31, userType: "FACULTY", facultyType: "ADMIN" } };
jest.mock("react-redux", () => ({ useSelector: (selector) => selector(mockState) }));
jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("@/api/Services/TenantAdminService", () => ({
  getCollegeSettings: jest.fn(), putCollegeSettings: jest.fn(), deleteCollegeSetting: jest.fn(),
  getGlobalSettings: jest.fn(), putGlobalSettings: jest.fn(),
}));

beforeEach(() => jest.clearAllMocks());

test("college admin reads the two whitelisted policy values via the scoped API without tenant-admin access", async () => {
  Api.get.mockResolvedValue({ data: { settings: {
    "attendance.correctionWindowHours": 48,
    "attendance.eligibilityThresholdPercent": 80,
  } } });
  render(<PolicySettingField collegeId={9} settingKey="attendance.correctionWindowHours"
    label="Retroactive marking window" defaultValue={24} suffix="hours" />);
  await waitFor(() => expect(screen.getByText("48 hours")).toBeInTheDocument());
  expect(Api.get).toHaveBeenCalledWith("/api/v1/admin/attendance/policy?collegeId=9");
  expect(getCollegeSettings).not.toHaveBeenCalled();
  expect(putCollegeSettings).not.toHaveBeenCalled();
  expect(screen.getByText("Read-only")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Save" })).not.toBeInTheDocument();
});

test("a denied scoped policy read displays an error instead of a false default-value success", async () => {
  Api.get.mockRejectedValue({ response: { data: { message: "Not authorized for this college" } } });
  render(<PolicySettingField collegeId={10} settingKey="attendance.eligibilityThresholdPercent"
    label="Exam-eligibility threshold" defaultValue={75} suffix="%" />);
  expect(await screen.findByText("Not authorized for this college")).toBeInTheDocument();
  expect(getCollegeSettings).not.toHaveBeenCalled();
});
