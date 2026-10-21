/** Strong company search (docs/companies/COMPANY-SEARCH-2026-10-13.md): 42 keeps the other names a company goes by. */
import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CompanyCuration from "@/pages/superadmin/sections/CompanyCuration";
import { addCompanyAlias, listCuratedCompanies, removeCompanyAlias } from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => {
  const actual = jest.requireActual("@/api/Services/AdminService");
  return {
    ...actual,
    listCuratedCompanies: jest.fn(),
    addCompanyAlias: jest.fn(),
    removeCompanyAlias: jest.fn(),
  };
});
jest.setTimeout(30000);

const tcs = { id: 2, name: "Tata Consultancy Services", verifiedBy42: true, domains: ["tcs.com"], aliases: ["TCS iON"], colleges: 4, drives: 9 };

beforeEach(() => {
  jest.clearAllMocks();
  listCuratedCompanies.mockResolvedValue({ data: { items: [tcs], total: 1 } });
});

test("the list shows a company's other names and the editor adds and removes them", async () => {
  addCompanyAlias.mockResolvedValue({ data: ["TCS iON", "Tata Consultancy"] });
  removeCompanyAlias.mockResolvedValue({ data: ["Tata Consultancy"] });
  render(<CompanyCuration />);
  expect(await screen.findByText("Also known as TCS iON")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Other names" }));
  expect(await screen.findByText("Other names of Tata Consultancy Services")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Other name"), { target: { value: " Tata Consultancy " } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  await waitFor(() => expect(addCompanyAlias).toHaveBeenCalledWith(2, "Tata Consultancy"));
  const tags = await screen.findByTestId("company-aliases");
  expect(await within(tags).findByText("Tata Consultancy")).toBeInTheDocument();
  fireEvent.click(within(tags).getAllByRole("img", { name: "close" })[0]);
  await waitFor(() => expect(removeCompanyAlias).toHaveBeenCalledWith(2, "TCS iON"));
  await waitFor(() => expect(within(tags).queryByText("TCS iON")).toBeNull());
});

test("a refused name says why and keeps what was typed", async () => {
  addCompanyAlias.mockRejectedValue({ response: { status: 400, data: { message: "\"Infosys\" is the name of another company, Infosys Limited. Merge them instead." } } });
  render(<CompanyCuration />);
  fireEvent.click(await screen.findByRole("button", { name: "Other names" }));
  fireEvent.change(await screen.findByLabelText("Other name"), { target: { value: "Infosys" } });
  fireEvent.click(screen.getByRole("button", { name: "Add" }));
  expect(await screen.findByText(/Merge them instead/)).toBeInTheDocument();
  expect(screen.getByLabelText("Other name")).toHaveValue("Infosys");
});
