/**
 * @jest-environment jsdom
 */
import fs from "fs";
import path from "path";
import { render, screen, fireEvent, renderHook, waitFor, act } from "@testing-library/react";
import { label, actionText } from "../ui/labels";
import { formatWhen } from "../ui/formatWhen";
import ReasonPicker, { reasonIsValid } from "../ui/ReasonPicker";
import PageStrip from "../ui/PageStrip";
import { useLoad } from "../ui/useLoad";
import { normaliseDomain } from "../ui/domain";
import { StageTag } from "../recruiterLeadStages";
import { readShareMemory, writeShareMemory } from "../ui/shareMemory";
import { isTpoDataTableFiltered } from "../TpoDataTable";
import { readRecents, rememberRecent } from "../ui/recents";

jest.mock("next/link", () => ({ __esModule: true, default: ({ href, children, ...p }) => <a href={href} {...p}>{children}</a> }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn() }));
const { fetchWithErrorHandling } = require("@/api/Services/AdminService");

describe("labels", () => {
  it("never shows a raw constant", () => {
    expect(label("stage", "HIRED")).toBe("Placed");
    expect(label("drive", "PUBLISHED")).toBe("Live");
    expect(label("offer", "SOMETHING_NEW")).toBe("Something new");
    expect(label("actor", "TPO")).toBe("Placement team");
    expect(label("stage", null)).toBe("-");
    expect(actionText("round_scheduled")).toBe("Round scheduled");
  });
});

describe("formatWhen", () => {
  it("formats and tolerates junk", () => {
    expect(formatWhen("2026-10-02T10:30:00")).toMatch(/2 Oct, \d{1,2}:30 (AM|PM)/);
    expect(formatWhen(null)).toBe("");
    expect(formatWhen("not a date")).toBe("");
  });
});

describe("ReasonPicker", () => {
  const reasons = ["Not eligible", "Duplicate"];
  it("one tap picks a preset; Other reveals a box", () => {
    const onChange = jest.fn();
    const { rerender } = render(<ReasonPicker reasons={reasons} value="" onChange={onChange} />);
    fireEvent.click(screen.getByText("Duplicate"));
    expect(onChange).toHaveBeenCalledWith("Duplicate");
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByText("Other"));
    rerender(<ReasonPicker reasons={reasons} value="" onChange={onChange} />);
    expect(screen.getByRole("textbox")).toBeTruthy();
  });
  it("validity", () => {
    expect(reasonIsValid("Duplicate", reasons)).toBe(true);
    expect(reasonIsValid("ab", reasons)).toBe(false);
    expect(reasonIsValid("abc", reasons)).toBe(true);
    expect(reasonIsValid("", reasons)).toBe(false);
  });
});

describe("PageStrip", () => {
  it("renders doorways and hides when empty", () => {
    const { container, rerender } = render(<PageStrip items={[{ label: "Waiting", value: 3, href: "/tpo/requests" }, { label: "Skip", value: undefined }]} />);
    expect(screen.getByText("Waiting").closest("a").getAttribute("href")).toBe("/tpo/requests");
    expect(screen.queryByText("Skip")).toBeNull();
    rerender(<PageStrip items={[]} />);
    expect(container.firstChild).toBeNull();
    rerender(<PageStrip hideIfAllZero items={[{ label: "a", value: 0 }, { label: "b", value: "0" }]} />);
    expect(container.firstChild).toBeNull();
    rerender(<PageStrip hideIfAllZero items={[{ label: "a", value: 0 }, { label: "b", value: 2 }]} />);
    expect(container.firstChild).not.toBeNull();
  });
});

describe("useLoad", () => {
  beforeEach(() => fetchWithErrorHandling.mockReset());
  it("keeps last good data when a refresh fails", async () => {
    fetchWithErrorHandling.mockResolvedValueOnce({ success: true, data: [1, 2] });
    const { result } = renderHook(() => useLoad(() => Promise.resolve(), []));
    await waitFor(() => expect(result.current.data).toEqual([1, 2]));
    fetchWithErrorHandling.mockResolvedValueOnce({ success: false, data: { message: "boom" } });
    await act(async () => { await result.current.retry(); });
    expect(result.current.error).toBe("boom");
    expect(result.current.data).toEqual([1, 2]);
    expect(result.current.stale).toBe(true);
  });
  it("a failed first load is an error, not empty data", async () => {
    fetchWithErrorHandling.mockResolvedValueOnce({ success: false, data: {} });
    const { result } = renderHook(() => useLoad(() => Promise.resolve(), [], { fallback: "Nope" }));
    await waitFor(() => expect(result.current.error).toBe("Nope"));
    expect(result.current.data).toBeNull();
  });
});

describe("TPO stylesheets use tokens", () => {
  const dir = path.join(__dirname, "../../../styles/components");
  const BANNED = ["172033", "334155", "64748b", "66758d", "e7ecf2", "edf1f5", "e3e9f1", "e9eef5", "f8fafc", "fcfdff", "fbfcfe", "f7f9fc", "f8fbff", "94a3b8", "718096", "748197"];
  const files = fs.readdirSync(dir).filter((f) => /^_tpo-.*\.scss$/.test(f) && f !== "_tpo-tokens.scss");
  it.each(files)("%s has no legacy hard-coded neutrals", (f) => {
    const css = fs.readFileSync(path.join(dir, f), "utf8");
    const hits = BANNED.filter((h) => new RegExp(`#${h}\b`, "i").test(css));
    expect(hits).toEqual([]);
  });
  it.each(files)("%s has no text below 12px", (f) => {
    const css = fs.readFileSync(path.join(dir, f), "utf8");
    expect(css.match(/font-size:\s*(9|10|11)(\.\d)?px/g) || []).toEqual([]);
  });
});

describe("normaliseDomain", () => {
  it("cleans typed domains and rejects junk", () => {
    expect(normaliseDomain("  @Infosys.COM ")).toBe("infosys.com");
    expect(normaliseDomain("https://www.tcs.com/careers")).toBe("www.tcs.com");
    expect(normaliseDomain("infosys")).toBeNull();
    expect(normaliseDomain("not a domain.com")).toBeNull();
    expect(normaliseDomain("")).toBeNull();
  });
});

describe("StageTag", () => {
  it("does not crash on a stage it has never heard of", () => {
    render(<StageTag stage="SOMETHING_NEW" />);
    expect(screen.getByText("SOMETHING_NEW")).toBeTruthy();
  });
});

const USER_KEY = "userData";
describe("shareMemory", () => {
  beforeEach(() => window.localStorage.clear());
  it("remembers the contact and columns per company, case-insensitively", () => {
    expect(readShareMemory("Acme")).toBeNull();
    writeShareMemory("Acme Corp", { recipientEmail: "hr@acme.com", columns: ["name", "roll"], maxStage: "SHORTLISTED" });
    expect(readShareMemory("  acme corp ")).toEqual({ recipientEmail: "hr@acme.com", columns: ["name", "roll"], maxStage: "SHORTLISTED" });
    expect(readShareMemory("Globex")).toBeNull();
  });
  it("BE-0107: one account never sees another account's or college's remembered recipient", () => {
    const signIn = (id, collegeId) => window.localStorage.setItem(USER_KEY, JSON.stringify({ id, collegeId }));
    signIn(26, 6);
    writeShareMemory("Acme", { recipientEmail: "hr@acme.com", columns: ["name"] });
    expect(readShareMemory("Acme")?.recipientEmail).toBe("hr@acme.com");
    signIn(40, 9); // another TPO at another college on the same browser
    expect(readShareMemory("Acme")).toBeNull();
    signIn(26, 6);
    expect(readShareMemory("Acme")?.recipientEmail).toBe("hr@acme.com");
  });
  it("survives blocked storage and damaged data", () => {
    window.localStorage.setItem("tpo.shareMemory.v1", "{not json");
    expect(readShareMemory("Acme")).toBeNull();
    const spy = jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    expect(() => writeShareMemory("Acme", { recipientEmail: "a@b.co", columns: [] })).not.toThrow();
    spy.mockRestore();
  });
});

describe("isTpoDataTableFiltered", () => {
  it("switched-off toggles are not a filter (an empty Leads list must say 'No leads yet', not 'No results match')", () => {
    expect(isTpoDataTableFiltered("", { owner: null, stage: null, quiet: false, due: false })).toBe(false);
    expect(isTpoDataTableFiltered("", { view: "ALL", branch: null })).toBe(false);
    expect(isTpoDataTableFiltered("acme", {})).toBe(true);
    expect(isTpoDataTableFiltered("", { quiet: true })).toBe(true);
    expect(isTpoDataTableFiltered("", { stage: "NEW" })).toBe(true);
  });
});

describe("palette recents", () => {
  beforeEach(() => window.localStorage.clear());
  it("keeps the last five places, newest first, without duplicates", () => {
    for (let i = 1; i <= 7; i += 1) rememberRecent({ key: `k${i}`, label: `Drive ${i}`, href: `/tpo/drives/${i}` });
    rememberRecent({ key: "k5", label: "Drive 5", href: "/tpo/drives/5" });
    const r = readRecents();
    expect(r).toHaveLength(5);
    expect(r[0].href).toBe("/tpo/drives/5");
    expect(new Set(r.map((x) => x.href)).size).toBe(5);
  });
  it("does not remember plain navigation or quick-create items, and survives bad data", () => {
    rememberRecent({ key: "n", label: "Go to Home", href: "/tpo/home" });
    rememberRecent({ key: "q", label: "New lead", href: "/tpo/recruiters?add=1" });
    rememberRecent({ key: "s", label: "Asha Rao · 21CS001", href: "/tpo/students?q=21CS001&student=5" });
    expect(readRecents()).toEqual([]);
    window.localStorage.setItem("tpo.recents.v1", "nope");
    expect(readRecents()).toEqual([]);
  });
});
