jest.mock("@/api/ApiMethod", () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

import Api from "@/api/ApiMethod";
import { exportLogs } from "../SuperAdminLogsService";

describe("exportLogs", () => {
  beforeEach(() => {
    Api.post.mockReset();
  });

  test("extracts the filename from a Content-Disposition header", async () => {
    const blob = new Blob(["line1\n"], { type: "application/x-ndjson" });
    Api.post.mockResolvedValue({
      data: blob,
      headers: { "content-disposition": 'attachment; filename="lms-logs_PRODUCTION_20260926T1400Z_to_20260927T0200Z.ndjson"' },
    });

    const result = await exportLogs({ environment: "PRODUCTION", level: "WARNING", search: "", since: "a", until: "b" });

    expect(result.filename).toBe("lms-logs_PRODUCTION_20260926T1400Z_to_20260927T0200Z.ndjson");
    expect(result.blob).toBe(blob);
    expect(Api.post).toHaveBeenCalledWith(
      "/api/v1/superadmin/logs/export",
      { environment: "PRODUCTION", level: "WARNING", search: "", since: "a", until: "b" },
      expect.objectContaining({ responseType: "blob" })
    );
  });

  test("falls back to a generic filename when the header is missing", async () => {
    Api.post.mockResolvedValue({ data: new Blob(["x"]), headers: {} });

    const result = await exportLogs({ environment: "PRODUCTION", level: "WARNING" });

    expect(result.filename).toBe("lms-logs.ndjson");
  });

  test("surfaces the real backend message instead of an opaque Blob for a JSON error response", async () => {
    const text = JSON.stringify({ message: "Range is too wide -- pick at most 31 days at a time." });
    const errorBlob = new Blob([text], { type: "application/json" });
    errorBlob.text = () => Promise.resolve(text); // jsdom's Blob has no .text(); real browsers do.
    Api.post.mockRejectedValue({ response: { data: errorBlob } });

    await expect(exportLogs({ environment: "PRODUCTION", level: "WARNING" }))
      .rejects.toThrow("Range is too wide -- pick at most 31 days at a time.");
  });

  test("falls back to a generic message when the error blob isn't valid JSON", async () => {
    const errorBlob = new Blob(["not json"], { type: "application/json" });
    errorBlob.text = () => Promise.resolve("not json");
    Api.post.mockRejectedValue({ response: { data: errorBlob } });

    await expect(exportLogs({ environment: "PRODUCTION", level: "WARNING" }))
      .rejects.toThrow("Logs could not be exported.");
  });

  test("rethrows a plain network error unchanged", async () => {
    const networkError = new Error("Network Error");
    Api.post.mockRejectedValue(networkError);

    await expect(exportLogs({ environment: "PRODUCTION", level: "WARNING" })).rejects.toBe(networkError);
  });
});
