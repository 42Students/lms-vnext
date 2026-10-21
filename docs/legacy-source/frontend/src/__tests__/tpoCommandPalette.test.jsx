/**
 * The top bar search is a record finder: it looks up a student, recruiter, company or drive and opens it.
 * It has no "Go to <page>" or "New ..." items (the sidebar and the + New menu do that).
 */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import TpoCommandPalette from "@/components/tpo/TpoCommandPalette";
import { globalSearch } from "@/api/Services/TpoHubService";

jest.mock("@/api/Services/TpoHubService", () => ({ globalSearch: jest.fn() }));

const EMPTY = { recruiterLeads: [], drives: [], students: [], companies: [] };
beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  globalSearch.mockResolvedValue({ data: EMPTY });
});

test("with nothing typed it explains what to type, and offers no page names or actions", async () => {
  render(<TpoCommandPalette open onClose={jest.fn()} onNavigate={jest.fn()} />);
  expect(await screen.findByText(/Type a name or a roll number/)).toBeInTheDocument();
  expect(screen.queryByText("Go to Home")).not.toBeInTheDocument();
  expect(screen.queryByText("New lead")).not.toBeInTheDocument();
});

test("results are grouped as Students, Recruiters, Companies and Drives, with what tells two people apart", async () => {
  globalSearch.mockResolvedValue({ data: {
    students: [{ learnerId: 5, firstName: "Asha", lastName: "Rao", rollNumber: "21CS001", branch: "CSE" }],
    recruiterLeads: [{ id: 1, name: "Priya Nair", company: "Globex" }],
    companies: [{ name: "Globex" }],
    drives: [{ id: 22, company: "Globex", title: "Consultant", status: "PUBLISHED" }],
  } });
  const onNavigate = jest.fn();
  const onClose = jest.fn();
  render(<TpoCommandPalette open onClose={onClose} onNavigate={onNavigate} />);
  fireEvent.change(screen.getByPlaceholderText("Find a student, recruiter, company or drive"), { target: { value: "ash" } });
  expect(await screen.findByText("Asha Rao")).toBeInTheDocument();
  expect(screen.getByText("21CS001 · CSE")).toBeInTheDocument();
  ["Students", "Recruiters", "Companies", "Drives"].forEach((g) => expect(screen.getByText(g)).toBeInTheDocument());
  fireEvent.click(screen.getByText("Asha Rao"));
  expect(onNavigate).toHaveBeenCalledWith("/tpo/students?q=21CS001&student=5");
  expect(onClose).toHaveBeenCalled();
});

test("a recruiter opens the lead page and a drive opens the drive", async () => {
  globalSearch.mockResolvedValue({ data: { ...EMPTY, recruiterLeads: [{ id: 1, name: "Priya Nair", company: "Globex" }], drives: [{ id: 22, company: "Globex", title: "Consultant", status: "PUBLISHED" }] } });
  const onNavigate = jest.fn();
  render(<TpoCommandPalette open onClose={jest.fn()} onNavigate={onNavigate} />);
  fireEvent.change(screen.getByPlaceholderText(/Find a student/), { target: { value: "glo" } });
  fireEvent.click(await screen.findByText("Priya Nair"));
  expect(onNavigate).toHaveBeenCalledWith("/tpo/recruiters/1");
});

test("a search with no match says what was looked for", async () => {
  render(<TpoCommandPalette open onClose={jest.fn()} onNavigate={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText(/Find a student/), { target: { value: "zzzz" } });
  expect(await screen.findByText(/No student, recruiter, company or drive matches "zzzz"/)).toBeInTheDocument();
});

test("arrow keys move the selection and Enter opens it", async () => {
  globalSearch.mockResolvedValue({ data: { ...EMPTY, recruiterLeads: [{ id: 1, name: "Priya Nair", company: "Globex" }, { id: 2, name: "Rahul Mehta", company: "Initech" }] } });
  const onNavigate = jest.fn();
  render(<TpoCommandPalette open onClose={jest.fn()} onNavigate={onNavigate} />);
  fireEvent.change(screen.getByPlaceholderText(/Find a student/), { target: { value: "ra" } });
  await screen.findByText("Rahul Mehta");
  const palette = screen.getByTestId("tpo.command-palette");
  fireEvent.keyDown(palette, { key: "ArrowDown" });
  fireEvent.keyDown(palette, { key: "Enter" });
  expect(onNavigate).toHaveBeenCalledWith("/tpo/recruiters/2");
});

test("Escape closes it", async () => {
  const onClose = jest.fn();
  render(<TpoCommandPalette open onClose={onClose} onNavigate={jest.fn()} />);
  fireEvent.keyDown(await screen.findByTestId("tpo.command-palette"), { key: "Escape" });
  expect(onClose).toHaveBeenCalled();
});

// BE-0101: the newest query owns the results; an older answer that lands late is dropped.
test("a late answer for an older query does not replace the newer query's results", async () => {
  let resolveOld;
  globalSearch
    .mockImplementationOnce(() => new Promise((r) => { resolveOld = r; }))
    .mockResolvedValueOnce({ data: { ...EMPTY, students: [{ learnerId: 2, firstName: "Bala", rollNumber: "21CS002" }] } });
  render(<TpoCommandPalette open onClose={jest.fn()} onNavigate={jest.fn()} />);
  const box = screen.getByPlaceholderText("Find a student, recruiter, company or drive");
  fireEvent.change(box, { target: { value: "as" } });
  await new Promise((r) => setTimeout(r, 260));
  fireEvent.change(box, { target: { value: "bal" } });
  expect(await screen.findByText("Bala")).toBeInTheDocument();
  resolveOld({ data: { ...EMPTY, students: [{ learnerId: 1, firstName: "Asha", rollNumber: "21CS001" }] } });
  await new Promise((r) => setTimeout(r, 20));
  expect(screen.queryByText("Asha")).not.toBeInTheDocument();
  expect(screen.getByText("Bala")).toBeInTheDocument();
});

test("a failed search says so instead of 'no matches'", async () => {
  globalSearch.mockRejectedValueOnce(new Error("500"));
  render(<TpoCommandPalette open onClose={jest.fn()} onNavigate={jest.fn()} />);
  fireEvent.change(screen.getByPlaceholderText("Find a student, recruiter, company or drive"), { target: { value: "zz" } });
  expect(await screen.findByText(/Search didn't work just now/)).toBeInTheDocument();
});
