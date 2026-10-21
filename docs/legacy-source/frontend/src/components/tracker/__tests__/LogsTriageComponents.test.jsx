import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ClaudeReportModal from "../ClaudeReportModal";
import TriageMenu from "../TriageMenu";
import LogHealthStrip from "../LogHealthStrip";
import { generateReport } from "@/utils/logReportSource";
import {
  getCloudLogDetail,
  getLogContext,
  linkKnownErrorIssue,
  muteKnownError,
  setKnownErrorStatus,
} from "@/api/Services/SuperAdminLogsService";
import { createBugReport } from "@/api/Services/BugTrackerService";
import { copyTextToClipboard } from "@/utils/bugTrackerUtils";
import { downloadText } from "@/utils/downloadText";

jest.mock("@/api/Services/SuperAdminLogsService");
jest.mock("@/api/Services/BugTrackerService");
jest.mock("@/utils/logReportSource", () => ({
  ...jest.requireActual("@/utils/logReportSource"),
  generateReport: jest.fn(),
}));
jest.mock("@/utils/downloadText", () => ({ downloadText: jest.fn() }));
jest.mock("@/utils/bugTrackerUtils", () => ({ ...jest.requireActual("@/utils/bugTrackerUtils"), copyTextToClipboard: jest.fn() }));

beforeAll(() => {
  window.matchMedia = window.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }));
});

describe("ClaudeReportModal", () => {
  const fakeResult = {
    filename: "lms-report_PRODUCTION_x.md",
    markdown: "# 42LMS log triage report\nbody",
    rawText: '{"_meta":true}\n',
    model: { totalEvents: 12, groups: [{}, {}, {}], newTypes: 1, regressions: 1, truncated: false },
  };

  beforeEach(() => {
    generateReport.mockReset();
    downloadText.mockReset();
    copyTextToClipboard.mockReset();
  });

  test("builds a report for the chosen range and level, then offers the file", async () => {
    generateReport.mockImplementation(async ({ onProgress }) => {
      onProgress({ phase: "logs", done: 2, total: 4 });
      return fakeResult;
    });
    render(<ClaudeReportModal open onClose={() => {}} environment="PRODUCTION" />);

    fireEvent.click(screen.getByText("3 days"));
    fireEvent.click(screen.getByText("Warnings + errors"));
    fireEvent.click(screen.getByRole("button", { name: /build report/i }));

    await screen.findByText("12");
    expect(generateReport).toHaveBeenCalledTimes(1);
    const args = generateReport.mock.calls[0][0];
    expect(args.environment).toBe("PRODUCTION");
    expect(args.level).toBe("WARNING");
    expect(new Date(args.until) - new Date(args.since)).toBe(3 * 86_400_000);
    expect(args.includePrevious).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: /download report/i }));
    expect(downloadText).toHaveBeenCalledWith("lms-report_PRODUCTION_x.md", fakeResult.markdown, "text/markdown");

    fireEvent.click(screen.getByRole("button", { name: /raw lines/i }));
    expect(downloadText).toHaveBeenLastCalledWith("lms-report_PRODUCTION_x.ndjson", fakeResult.rawText, "application/x-ndjson");
  });

  test("short ranges compare with the previous period by default", async () => {
    generateReport.mockResolvedValue(fakeResult);
    render(<ClaudeReportModal open onClose={() => {}} environment="PRODUCTION" />);
    fireEvent.click(screen.getByRole("button", { name: /build report/i }));
    await screen.findByText("12");
    expect(generateReport.mock.calls[0][0].includePrevious).toBe(true);
  });

  test("copying puts the markdown on the clipboard", async () => {
    generateReport.mockResolvedValue(fakeResult);
    copyTextToClipboard.mockResolvedValue();
    render(<ClaudeReportModal open onClose={() => {}} environment="PRODUCTION" />);
    fireEvent.click(screen.getByRole("button", { name: /build report/i }));
    await screen.findByText("12");
    fireEvent.click(screen.getByRole("button", { name: /copy report/i }));
    await waitFor(() => expect(copyTextToClipboard).toHaveBeenCalledWith(fakeResult.markdown));
  });

  test("a failure shows the message and lets the user try again", async () => {
    generateReport.mockRejectedValue(new Error("Range is too wide"));
    render(<ClaudeReportModal open onClose={() => {}} environment="DEVELOPMENT" />);
    fireEvent.click(screen.getByRole("button", { name: /build report/i }));
    expect(await screen.findByText("Range is too wide")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /build report/i })).toBeInTheDocument();
  });

  test("warns when the export was truncated", async () => {
    generateReport.mockResolvedValue({ ...fakeResult, model: { ...fakeResult.model, truncated: true } });
    render(<ClaudeReportModal open onClose={() => {}} environment="PRODUCTION" />);
    fireEvent.click(screen.getByRole("button", { name: /build report/i }));
    expect(await screen.findByText("Some entries were cut off")).toBeInTheDocument();
  });
});

describe("TriageMenu", () => {
  const group = {
    count: 3,
    entry: { insertId: "a", logName: "n", message: "Boom", severity: "ERROR", timestamp: "2026-09-28T10:00:00Z", httpMethod: "GET", httpPath: "/api/v1/x", httpStatus: "500", userId: "7", userType: "LEARNER" },
    occurrences: [{ insertId: "a", logName: "n", message: "Boom", severity: "ERROR", timestamp: "2026-09-28T10:00:00Z", httpPath: "/api/v1/x", userId: "7", userType: "LEARNER" }],
  };
  const known = { id: 5, fixStatus: "OPEN", muted: false };

  beforeEach(() => {
    [getCloudLogDetail, getLogContext, linkKnownErrorIssue, muteKnownError, setKnownErrorStatus, createBugReport, copyTextToClipboard].forEach((fn) => fn.mockReset());
    getCloudLogDetail.mockResolvedValue({ exception: "boom\n\tat com._42students.lms.a.B.c(B.java:4)" });
    getLogContext.mockResolvedValue({ users: [], colleges: [] });
    copyTextToClipboard.mockResolvedValue();
  });

  const open = async () => {
    fireEvent.click(screen.getByRole("button", { name: /triage actions/i }));
    await screen.findByText("Copy for Claude");
  };

  test("copy for Claude puts a self-contained prompt on the clipboard", async () => {
    render(<TriageMenu group={group} known={known} environment="PRODUCTION" deploys={[]} onChanged={() => {}} />);
    await open();
    fireEvent.click(screen.getByText("Copy for Claude"));
    await waitFor(() => expect(copyTextToClipboard).toHaveBeenCalled());
    const text = copyTextToClipboard.mock.calls[0][0];
    expect(text).toContain("Investigate this production error");
    expect(text).toContain("SELECT * FROM learner WHERE id = 7;");
    expect(text).toContain("B.java:4");
  });

  test("create tracker issue files it and links it to the tracked error", async () => {
    createBugReport.mockResolvedValue({ publicId: "LMS-0042" });
    linkKnownErrorIssue.mockResolvedValue({});
    const onChanged = jest.fn();
    render(<TriageMenu group={group} known={known} environment="PRODUCTION" deploys={[]} onChanged={onChanged} />);
    await open();
    fireEvent.click(screen.getByText("Create tracker issue"));
    await waitFor(() => expect(linkKnownErrorIssue).toHaveBeenCalledWith(5, "LMS-0042"));
    expect(createBugReport.mock.calls[0][0]).toMatchObject({ environment: "PRODUCTION", page: "Backend logs", reporterName: "Logs (auto)" });
    expect(onChanged).toHaveBeenCalled();
  });

  test("mark fixed asks for the commit, prefilled from the latest deploy, and saves it", async () => {
    setKnownErrorStatus.mockResolvedValue({});
    const deploys = [{ at: "2026-09-28T09:00:00Z", commit: "abcdef1234567890", pods: 2 }];
    render(<TriageMenu group={group} known={known} environment="PRODUCTION" deploys={deploys} onChanged={() => {}} />);
    await open();
    fireEvent.click(screen.getByText("Mark fixed…"));
    const input = await screen.findByPlaceholderText("e.g. abc1234");
    expect(input).toHaveValue("abcdef1");
    fireEvent.click(screen.getByRole("button", { name: /mark fixed/i }));
    await waitFor(() => expect(setKnownErrorStatus).toHaveBeenCalledWith(5, { status: "FIXED", commit: "abcdef1", note: null }));
  });

  test("expected and mute both require a reason before they can be saved", async () => {
    muteKnownError.mockResolvedValue();
    render(<TriageMenu group={group} known={known} environment="PRODUCTION" deploys={[]} onChanged={() => {}} />);
    await open();
    fireEvent.click(screen.getByText("Mute with a reason…"));
    const save = await screen.findByRole("button", { name: /^mute$/i });
    expect(save).toBeDisabled();
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "crawler noise" } });
    expect(save).not.toBeDisabled();
    fireEvent.click(save);
    await waitFor(() => expect(muteKnownError).toHaveBeenCalledWith(5, true, "crawler noise"));
  });

  test("an error the poller has not tracked shows why status actions are unavailable", async () => {
    render(<TriageMenu group={group} known={undefined} environment="PRODUCTION" deploys={[]} onChanged={() => {}} />);
    await open();
    expect(screen.getByText(/tracked once the alerting poller/i)).toBeInTheDocument();
    expect(screen.queryByText("Mark fixed…")).not.toBeInTheDocument();
  });

  test("a regression can be reopened", async () => {
    setKnownErrorStatus.mockResolvedValue({});
    render(<TriageMenu group={group} known={{ id: 5, fixStatus: "FIXED", regressedAt: "2026-09-28T09:00:00Z", muted: false }} environment="PRODUCTION" deploys={[]} onChanged={() => {}} />);
    await open();
    fireEvent.click(screen.getByText("Reopen"));
    await waitFor(() => expect(setKnownErrorStatus).toHaveBeenCalledWith(5, { status: "OPEN" }));
  });
});

describe("LogHealthStrip", () => {
  const digest = { newErrors: [{ id: 1 }, { id: 2 }], regressions: [], stillActive: 4, deploys: [] };
  const deploys = [{ at: new Date(Date.now() - 2 * 3_600_000).toISOString(), commit: "abcdef1234567890", pods: 2 }];

  test("shows the counts, the latest release and how it behaved", () => {
    render(<LogHealthStrip environment="PRODUCTION" digest={digest} deploys={deploys} health={{ verdict: "JUMP", errorsBefore: 1, errorsAfter: 9 }} onOpenDigest={() => {}} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("new error types (24h)")).toBeInTheDocument();
    expect(screen.getByText("abcdef1")).toBeInTheDocument();
    expect(screen.getByText("Errors jumped")).toBeInTheDocument();
    expect(screen.getByText(/last deploy 2h ago/)).toBeInTheDocument();
  });

  test("opens the digest when a count is clicked", () => {
    const onOpenDigest = jest.fn();
    render(<LogHealthStrip environment="PRODUCTION" digest={digest} deploys={[]} health={null} onOpenDigest={onOpenDigest} />);
    fireEvent.click(screen.getByText("new error types (24h)").closest("button"));
    expect(onOpenDigest).toHaveBeenCalled();
  });

  test("outside production it says tracking is production-only and still shows deploys", () => {
    render(<LogHealthStrip environment="DEVELOPMENT" digest={null} deploys={deploys} health={null} onOpenDigest={() => {}} />);
    expect(screen.getByText(/cover production/i)).toBeInTheDocument();
    expect(screen.getByText("abcdef1")).toBeInTheDocument();
  });

  test("with no deploy history it says so instead of showing a blank", () => {
    render(<LogHealthStrip environment="PRODUCTION" digest={digest} deploys={[]} health={null} onOpenDigest={() => {}} />);
    expect(screen.getByText("no deploys recorded yet")).toBeInTheDocument();
  });
});
