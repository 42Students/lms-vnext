import fs from "fs";
import path from "path";
import { act, renderHook, waitFor } from "@testing-library/react";
import useLogInsights from "@/components/tracker/useLogInsights";
import { getDeploys, getKnownErrors, getLogDigest } from "@/api/Services/SuperAdminLogsService";

jest.mock("@/api/Services/SuperAdminLogsService", () => ({
  getDeployHealth: jest.fn().mockResolvedValue(null),
  getDeploys: jest.fn(),
  getKnownErrors: jest.fn(),
  getLogDigest: jest.fn(),
}));

const read = (rel) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => { resolve = r; });
  return { promise, resolve };
};

beforeEach(() => {
  jest.clearAllMocks();
  getDeploys.mockResolvedValue([]);
  getLogDigest.mockResolvedValue(null);
});

// BE-0064: a known-errors refresh for environment A that lands after switching to B is dropped.
test("a late known-errors refresh for the old environment does not overwrite the new one", async () => {
  const lateA = deferred();
  getKnownErrors.mockImplementation((env) => (env === "A-late" ? lateA.promise : Promise.resolve([{ signatureHash: `h-${env}`, id: 1 }])));
  const { result, rerender } = renderHook(({ env }) => useLogInsights(env), { initialProps: { env: "DEV" } });
  await waitFor(() => expect(result.current.loading).toBe(false));
  // Start a refresh that will be slow, as if for the environment being left.
  getKnownErrors.mockImplementationOnce(() => lateA.promise);
  let pending;
  act(() => { pending = result.current.reloadKnown(); });
  rerender({ env: "PRODUCTION" });
  await waitFor(() => expect(result.current.knownByHash.has("h-PRODUCTION")).toBe(true));
  await act(async () => { lateA.resolve([{ signatureHash: "h-OLD", id: 9 }]); await pending; });
  expect(result.current.knownByHash.has("h-OLD")).toBe(false);
  expect(result.current.knownByHash.has("h-PRODUCTION")).toBe(true);
});

test("a failed known-errors refresh keeps the current labels", async () => {
  getKnownErrors.mockResolvedValueOnce([{ signatureHash: "h1", id: 1 }]);
  const { result } = renderHook(() => useLogInsights("DEV"));
  await waitFor(() => expect(result.current.knownByHash.has("h1")).toBe(true));
  getKnownErrors.mockRejectedValueOnce(new Error("500"));
  await act(async () => { await result.current.reloadKnown(); });
  expect(result.current.knownByHash.has("h1")).toBe(true);
});

// BE-0063 / BE-0065 (source contracts; the components need a full logs page to render).
test("triage says when linking failed, and an aborted issue-list request can't clear the newer spinner", () => {
  const triage = read("src/components/tracker/TriageMenu.jsx");
  expect(triage).not.toContain("linkKnownErrorIssue(known.id, issue.publicId).catch(() => {})");
  expect(triage).toContain("but it could not be linked to this error");
  const issues = read("src/pages/tracker/issues/index.js");
  expect(issues).toContain("if (!controller.signal.aborted) setFetching(false);");
});
