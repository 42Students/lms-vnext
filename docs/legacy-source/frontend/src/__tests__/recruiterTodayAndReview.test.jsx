/** recruiter V2 Today (what needs me) and the focused applicant review (keys, undo, draft, send). */
import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import RecruiterToday from "@/components/recruiter/RecruiterToday";
import RecruiterFocusedReview from "@/components/recruiter/RecruiterFocusedReview";
import { getRecruiterToday, submitRoundResults } from "@/api/Services/RecruiterService";
import { draftKey } from "@/components/recruiter/recruiterReviewUtils";
import moment from "moment";

const mockPush = jest.fn();
jest.mock("next/router", () => ({ useRouter: () => ({ push: mockPush, query: {} }) }));
jest.mock("@/api/Services/RecruiterService", () => ({ getRecruiterToday: jest.fn(), submitRoundResults: jest.fn(), listMyDrives: jest.fn(() => Promise.resolve({ data: [{ id: 1 }] })) }));

const task = (over) => ({ id: "t", tone: "soon", title: "A task", detail: "detail", action: "Do it", jobId: 5, tab: "overview", ...over });
const today = (tasks, extra = {}) => ({ data: { tasks, thisWeek: [], liveDrive: null, ...extra } });

beforeEach(() => { jest.clearAllMocks(); window.localStorage.clear(); });

describe("Today", () => {
  test("shows what needs me with one button each, and the button goes where it is done", async () => {
    getRecruiterToday.mockResolvedValue(today([
      task({ id: "review-5", tone: "urgent", title: "4 new applicants to review", action: "Review now", tab: "applicants" }),
      task({ id: "changes-9", title: "The placement cell needs 1 detail", action: "Answer", jobId: 9, tab: "requests" }),
    ]));
    render(<RecruiterToday collegeId={7} firstName="Ananya" companyName="Acme" />);
    expect(await screen.findByText("4 new applicants to review")).toBeInTheDocument();
    expect(screen.getByText(/2 things need you today/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Review now" }));
    expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/5?tab=applicants&review=1");
    fireEvent.click(screen.getByRole("button", { name: "Answer" }));
    expect(mockPush).toHaveBeenCalledWith("/recruiter/drives/9?tab=messages");
  });

  test("things only the placement cell can move are said plainly, with no button", async () => {
    getRecruiterToday.mockResolvedValue(today([task({ id: "withcell-1", tone: "fine", title: "Results for Round 1 are with the placement cell", action: null })]));
    render(<RecruiterToday collegeId={7} />);
    expect(await screen.findByText("Results for Round 1 are with the placement cell")).toBeInTheDocument();
    expect(screen.getByTestId("recruiter.today.waiting-withcell-1")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Do it" })).not.toBeInTheDocument();
    expect(screen.getByTestId("recruiter.today.empty")).toBeInTheDocument(); // nothing for me to press
  });

  test("a task's time is an instant shown in the viewer's own zone with its label", async () => {
    const at = "2026-10-09T10:00:00Z";
    getRecruiterToday.mockResolvedValue(today([task({ id: "results-1", title: "Send results for Round 1", detail: "SDE", action: "Send results", at, atLabel: "Due" })]));
    render(<RecruiterToday collegeId={7} />);
    expect(await screen.findByText(`SDE \u00b7 Due ${moment(at).format("ddd D MMM, h:mm A")}`)).toBeInTheDocument();
  });

  test("an empty queue says so instead of showing a blank page", async () => {
    getRecruiterToday.mockResolvedValue(today([]));
    render(<RecruiterToday collegeId={7} />);
    expect(await screen.findByText("You are all caught up")).toBeInTheDocument();
  });

  test("a failed load shows a retryable error", async () => {
    getRecruiterToday.mockRejectedValueOnce({ response: { data: { error: "down" } } });
    getRecruiterToday.mockResolvedValueOnce(today([]));
    render(<RecruiterToday collegeId={7} />);
    // The backend text is not shown raw; the safe presentation message is.
    expect(await screen.findByTestId("recruiter.today.error")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Retry/ }));
    expect(await screen.findByText("You are all caught up")).toBeInTheDocument();
  });

  test("the live drive and this week are shown with real numbers", async () => {
    getRecruiterToday.mockResolvedValue(today([], {
      liveDrive: { jobId: 5, title: "SDE", applied: 42, deadline: "2026-10-12T17:00:00", listShared: false },
      thisWeek: [{ id: "round-1", type: "ROUND", title: "Round 1", jobTitle: "SDE", jobId: 5, start: "2026-10-09T10:00:00" }],
    }));
    render(<RecruiterToday collegeId={7} />);
    expect(await screen.findByText("42")).toBeInTheDocument();
    expect(screen.getByText(/has not been shared with you yet/)).toBeInTheDocument();
    expect(screen.getByText("Round 1")).toBeInTheDocument();
  });
});

describe("Focused review", () => {
  const people = [
    { applicantId: "a1", name: "Asha", roll: "R1", branch: "CSE", cgpa: "8-9", stage: "APPLIED", resume: "http://r/1" },
    { applicantId: "a2", name: "Bala", roll: "R2", branch: "IT", stage: "APPLIED" },
    { applicantId: "a3", name: "Chitra", stage: "APPLIED" },
  ];
  const renderReview = (props = {}) => render(<RecruiterFocusedReview applicants={people} collegeId={7} jobId="42" owner={9} round={{ id: 1, name: "Screening" }} onClose={jest.fn()} onSent={jest.fn()} {...props} />);
  const press = (key) => act(() => { fireEvent.keyDown(window, { key }); });
  const saved = () => JSON.parse(window.localStorage.getItem(draftKey(9, 7, "42", 1)) || "{}");

  test("shows one applicant at a time with only the shared details", () => {
    renderReview();
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("Asha");
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("CSE");
    expect(screen.queryByText("Bala")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 3")).toBeInTheDocument();
  });

  test("keys decide and advance, and the draft is kept in the browser", () => {
    renderReview();
    press("s");
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("Bala");
    press("r");
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("Chitra");
    expect(saved()).toEqual({ a1: "PASS", a2: "FAIL" });
  });

  test("undo takes back the last decision and returns to that person", () => {
    renderReview();
    press("s");
    press("h");
    expect(saved()).toEqual({ a1: "PASS", a2: "HOLD" });
    press("z");
    expect(saved()).toEqual({ a1: "PASS" });
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("Bala");
  });

  test("finishing shows a summary and sending stages the results for the placement cell", async () => {
    submitRoundResults.mockResolvedValue({ data: { applied: false } });
    const onSent = jest.fn(); const onClose = jest.fn();
    renderReview({ onSent, onClose });
    press("s"); press("h"); press("r");
    expect(await screen.findByTestId("recruiter.review.summary")).toHaveTextContent("3 reviewed");
    fireEvent.click(screen.getByTestId("recruiter.review.send"));
    await waitFor(() => expect(submitRoundResults).toHaveBeenCalledWith(7, "42", 1, [
      { applicantId: "a1", outcome: "PASS" }, { applicantId: "a2", outcome: "HOLD" }, { applicantId: "a3", outcome: "FAIL" },
    ]));
    await waitFor(() => expect(onSent).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
    expect(window.localStorage.getItem(draftKey(9, 7, "42", 1))).toBeNull();
  });

  test("a failed send keeps the draft so nothing is lost", async () => {
    submitRoundResults.mockRejectedValue({ response: { data: { error: "down" } } });
    renderReview();
    press("s"); press("s"); press("s");
    fireEvent.click(await screen.findByTestId("recruiter.review.send"));
    await waitFor(() => expect(submitRoundResults).toHaveBeenCalled());
    expect(Object.keys(saved())).toHaveLength(3);
  });

  test("closing and reopening resumes where the recruiter stopped", () => {
    const first = renderReview();
    press("s");
    first.unmount();
    renderReview();
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("Bala"); // Asha is decided, so the undecided come first
  });

  test("the digit keys give a private rating that is saved for the author, and pressing it again clears it", async () => {
    const onNote = jest.fn().mockResolvedValue({});
    renderReview({ onNote });
    press("4");
    await waitFor(() => expect(onNote).toHaveBeenCalledWith("a1", 4, ""), { timeout: 3000 });
    press("4");
    await waitFor(() => expect(onNote).toHaveBeenLastCalledWith("a1", null, ""), { timeout: 3000 });
  });

  test("a private note is saved as it is typed, for the applicant on screen, and typing never triggers a decision", async () => {
    const onNote = jest.fn().mockResolvedValue({});
    renderReview({ onNote });
    fireEvent.change(screen.getByLabelText("Private note"), { target: { value: "Strong on SQL, ask about the s3 project" } });
    await waitFor(() => expect(onNote).toHaveBeenCalledWith("a1", null, "Strong on SQL, ask about the s3 project"), { timeout: 3000 });
    expect(saved()).toEqual({}); // the letters in the note were not read as S / H / R decisions
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("Asha");
  });

  test("a saved rating and note come back when the applicant is on screen", () => {
    renderReview({ notes: { a1: { rating: 5, note: "Hire" } } });
    expect(screen.getByLabelText("Private note")).toHaveValue("Hire");
    expect(screen.getAllByRole("radio", { checked: true }).length).toBeGreaterThan(0);
  });

  test("a link a student typed is only shown when it is a plain web address", () => {
    renderReview({ applicants: [
      { applicantId: "a1", name: "Asha", stage: "APPLIED", resume: "javascript:alert(document.cookie)", github: "https://github.com/asha", portfolio: "data:text/html,x" },
    ] });
    const card = screen.getByTestId("recruiter.review.card");
    expect(card.querySelector('a[href^="javascript"]')).toBeNull();
    expect(card.querySelector('a[href^="data"]')).toBeNull();
    expect(screen.queryByText("Open resume")).not.toBeInTheDocument();
    expect(screen.getByText("GitHub").closest("a")).toHaveAttribute("href", "https://github.com/asha");
    expect(screen.getByText("GitHub").closest("a")).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Waitlist is called that, W chooses it, and H still does", () => {
    renderReview();
    expect(screen.getByTestId("recruiter.review.hold")).toHaveTextContent("Waitlist");
    press("w");
    press("h");
    expect(saved()).toEqual({ a1: "HOLD", a2: "HOLD" });
  });

  test("a note typed for one applicant is saved even if the recruiter moves on straight away", async () => {
    const onNote = jest.fn().mockResolvedValue({});
    renderReview({ onNote });
    fireEvent.change(screen.getByLabelText("Private note"), { target: { value: "Asha: strong" } });
    press("s"); // moves to the next applicant before the 700 ms save fires
    expect(onNote).toHaveBeenCalledWith("a1", null, "Asha: strong");
    fireEvent.change(screen.getByLabelText("Private note"), { target: { value: "Bala: weak" } });
    press("r");
    expect(onNote).toHaveBeenCalledWith("a2", null, "Bala: weak");
    expect(onNote).toHaveBeenCalledTimes(2);
  });

  test("a note that has not been saved yet is saved when the review closes", async () => {
    const onNote = jest.fn().mockResolvedValue({});
    const view = renderReview({ onNote });
    fireEvent.change(screen.getByLabelText("Private note"), { target: { value: "Do not lose me" } });
    expect(onNote).not.toHaveBeenCalled();
    view.unmount();
    expect(onNote).toHaveBeenCalledWith("a1", null, "Do not lose me");
  });

  test("a draft is private to the recruiter who made it", () => {
    window.localStorage.setItem(draftKey(9, 7, "42", 1), JSON.stringify({ a1: "PASS" }));
    renderReview({ owner: 10 });
    expect(screen.getByTestId("recruiter.review.card")).toHaveTextContent("Asha"); // nothing of recruiter 9's draft applies to recruiter 10
    expect(screen.queryByText(/Your decision:/)).not.toBeInTheDocument();
  });

  test("people in an old draft who are no longer on the drive are never sent", async () => {
    submitRoundResults.mockResolvedValue({ data: {} });
    window.localStorage.setItem(draftKey(9, 7, "42", 1), JSON.stringify({ a1: "PASS", gone: "FAIL" }));
    renderReview();
    press("s"); press("s"); press("s"); // a2, a3, then back to a1 who was already in the draft
    fireEvent.click(await screen.findByTestId("recruiter.review.send"));
    await waitFor(() => expect(submitRoundResults).toHaveBeenCalled());
    const rows = submitRoundResults.mock.calls[0][3];
    expect(rows.map((r) => r.applicantId).sort()).toEqual(["a1", "a2", "a3"]);
  });

  test("Tab stays inside the review", () => {
    renderReview();
    const dialog = screen.getByTestId("recruiter.review");
    const focusables = Array.from(dialog.querySelectorAll('button:not([disabled]), a[href], textarea, input, [tabindex]:not([tabindex="-1"])'));
    focusables[focusables.length - 1].focus();
    fireEvent.keyDown(focusables[focusables.length - 1], { key: "Tab" });
    expect(document.activeElement).toBe(focusables[0]);
    fireEvent.keyDown(focusables[0], { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(focusables[focusables.length - 1]);
  });

  test("when everyone is already out of the process there is nothing to review", () => {
    renderReview({ applicants: [{ applicantId: "x", name: "X", stage: "REJECTED" }] });
    expect(screen.getByTestId("recruiter.review.nobody")).toBeInTheDocument();
  });

  test("keys typed into a text field are not treated as decisions", () => {
    renderReview();
    const input = document.createElement("input");
    document.body.appendChild(input); input.focus();
    act(() => { fireEvent.keyDown(input, { key: "s" }); });
    expect(saved()).toEqual({});
    input.remove();
  });
});
