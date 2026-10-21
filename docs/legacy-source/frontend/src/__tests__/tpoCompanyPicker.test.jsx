/** Recruiter phase 1, N3: the drive form's company picker (search, verified lock, Add other with the hidden recruiter-email note). */
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Form } from "antd";
import CompanyPicker, { RECRUITER_EMAIL_NOTE } from "@/components/tpo/drive/CompanyPicker";
import { resolveCompany, searchCompanies } from "@/api/Services/TpoHubService";

jest.mock("@/api/Services/TpoHubService", () => ({ searchCompanies: jest.fn(), resolveCompany: jest.fn() }));
jest.setTimeout(30000);

function Harness({ onValues }) {
  const [form] = Form.useForm();
  return (
    <Form form={form} onValuesChange={(_, all) => onValues(all)}>
      <Form.Item name="companyId" hidden><input /></Form.Item>
      <Form.Item name="companyName" label="Company"><CompanyPicker form={form} /></Form.Item>
      <button type="button" onClick={() => onValues(form.getFieldsValue(true))}>read</button>
    </Form>
  );
}

beforeEach(() => jest.clearAllMocks());

test("picking a company verified by 42 locks its name", async () => {
  searchCompanies.mockResolvedValue({ data: [{ id: 7, name: "Omega Technologies", domains: ["omega.com"], verifiedBy42: true, inMyList: false }] });
  let values = {};
  render(<Harness onValues={(v) => { values = v; }} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "omega" } });
  fireEvent.click(await screen.findByText("Omega Technologies"));
  expect(await screen.findByText("Verified by 42")).toBeInTheDocument();
  expect(screen.getByLabelText("Company (verified by 42)")).toHaveAttribute("readonly");
  fireEvent.click(screen.getByText("read"));
  expect(values.companyId).toBe(7);
  expect(values.companyName).toBe("Omega Technologies");
});

test("Add other asks for website and recruiter email, and says that email is hidden from students", async () => {
  searchCompanies.mockResolvedValue({ data: [] });
  resolveCompany.mockResolvedValue({ data: { id: 9, name: "Zeta Labs", verifiedBy42: false, existed: false, nameLocked: false } });
  let values = {};
  render(<Harness onValues={(v) => { values = v; }} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Zeta Labs" } });
  fireEvent.click(await screen.findByText(/Add other:/));
  expect(await screen.findByText("Add a company")).toBeInTheDocument();
  expect(screen.getByLabelText(RECRUITER_EMAIL_NOTE)).toBeInTheDocument();
  fireEvent.change(screen.getByPlaceholderText("https://www.company.com"), { target: { value: "https://zetalabs.io" } });
  fireEvent.click(screen.getByRole("button", { name: "Use this company" }));
  await waitFor(() => expect(resolveCompany).toHaveBeenCalledWith({ name: "Zeta Labs", website: "https://zetalabs.io", recruiterEmail: null }));
  fireEvent.click(screen.getByText("read"));
  await waitFor(() => expect(values.companyId).toBe(9));
});

// Strong company search (docs/companies/COMPANY-SEARCH-2026-10-13.md).
test("each result says why it matched, and a near spelling reads as a question", async () => {
  searchCompanies.mockResolvedValue({ data: [
    { id: 2, name: "Tata Consultancy Services", domains: [], verifiedBy42: true, inMyList: false, source: "42", reason: "Also known as TCS", fuzzy: false },
    { id: 1, name: "Infosys Limited", domains: [], verifiedBy42: true, inMyList: false, source: "42", reason: "Did you mean Infosys Limited?", fuzzy: true },
  ] });
  render(<Harness onValues={() => {}} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "tcs" } });
  expect(await screen.findByText("Also known as TCS")).toBeInTheDocument();
  const fuzzy = screen.getByText("Did you mean Infosys Limited?");
  expect(fuzzy.closest(".tpo-company-picker__option--fuzzy")).not.toBeNull();
});

test("a name from Engage contacts opens Add other with the name filled in", async () => {
  searchCompanies.mockResolvedValue({ data: [{ id: null, name: "Kumaran Systems", domains: [], verifiedBy42: false, inMyList: true, source: "ENGAGE", reason: "In your Engage contacts, not added yet" }] });
  render(<Harness onValues={() => {}} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "kumaran" } });
  expect(await screen.findByText("From your Engage contacts, not added yet")).toBeInTheDocument();
  fireEvent.click(screen.getByText("Kumaran Systems"));
  expect(await screen.findByText("Add a company")).toBeInTheDocument();
  expect(screen.getByLabelText("Company name")).toHaveValue("Kumaran Systems");
});

test("Add other with the name of a company on the list points at it, or adds it when the TPO says it is different", async () => {
  searchCompanies.mockResolvedValue({ data: [] });
  resolveCompany
    .mockRejectedValueOnce({ response: { status: 409, data: { code: "SAME_COMPANY", companyId: 1, companyName: "Infosys Limited", message: "x" } } })
    .mockResolvedValueOnce({ data: { id: 12, name: "Infosys Pvt Ltd", verifiedBy42: false } });
  let values = {};
  render(<Harness onValues={(v) => { values = v; }} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Infosys Pvt Ltd" } });
  fireEvent.click(await screen.findByText(/Add other:/));
  fireEvent.click(await screen.findByRole("button", { name: "Use this company" }));
  expect(await screen.findByText("Infosys Limited is already on 42's company list")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "It's a different company" }));
  await waitFor(() => expect(resolveCompany).toHaveBeenLastCalledWith({ name: "Infosys Pvt Ltd", website: null, recruiterEmail: null, notTheSame: true }));
  fireEvent.click(screen.getByText("read"));
  await waitFor(() => expect(values.companyId).toBe(12));
});

test("Use the existing company picks it instead of making a second one", async () => {
  searchCompanies.mockResolvedValue({ data: [{ id: 1, name: "Infosys Limited", domains: ["infosys.com"], verifiedBy42: true, source: "42" }] });
  resolveCompany.mockRejectedValueOnce({ response: { status: 409, data: { code: "SAME_COMPANY", companyId: 1, companyName: "Infosys Limited" } } });
  let values = {};
  render(<Harness onValues={(v) => { values = v; }} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Infosys Pvt Ltd" } });
  fireEvent.click(await screen.findByText(/Add other:/));
  fireEvent.click(await screen.findByRole("button", { name: "Use this company" }));
  fireEvent.click(await screen.findByRole("button", { name: "Use Infosys Limited" }));
  expect(await screen.findByLabelText("Company (verified by 42)")).toHaveValue("Infosys Limited");
  expect(resolveCompany).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText("read"));
  expect(values.companyId).toBe(1);
});

test("an email at a verified company's domain switches Add a company to that company, locks it, and says why", async () => {
  searchCompanies.mockResolvedValue({ data: [] });
  resolveCompany.mockResolvedValue({ data: { id: 2, name: "Tata Consultancy Services", verifiedBy42: true, existed: true, nameLocked: true } });
  let values = {};
  render(<Harness onValues={(v) => { values = v; }} />);
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "Tata Hiring" } });
  fireEvent.click(await screen.findByText(/Add other:/));
  fireEvent.change(await screen.findByPlaceholderText("name@company.com"), { target: { value: "hr@tcs.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Use this company" }));
  expect(await screen.findByText(/belongs to Tata Consultancy Services, verified by 42/)).toBeInTheDocument();
  expect(screen.getByLabelText("Company (verified by 42)")).toHaveValue("Tata Consultancy Services");
  expect(screen.getByLabelText("Company (verified by 42)")).toHaveAttribute("readonly");
  fireEvent.click(screen.getByText("read"));
  expect(values.companyId).toBe(2);
});
