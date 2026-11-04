import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { BoundedFormDataError, readBoundedFormData } from "@/lib/bounded-form-data";

const url = "https://lms.example.test/api/upload";
const bad = (code: string) => expect.objectContaining({ code });

function streamRequest(bytes: Uint8Array, headers: Record<string, string>) {
  const body = new ReadableStream<Uint8Array>({
    start(controller) { controller.enqueue(bytes); controller.close(); },
  });
  return new Request(url, {
    method: "POST", headers, body, duplex: "half",
  } as RequestInit & { duplex: "half" });
}

describe("bounded form parsing", () => {
  it("accepts a real multipart upload, retaining binary bytes and fields", async () => {
    const form = new FormData();
    form.set("deliveryId", "delivery-1");
    form.set("file", new File([new Uint8Array([0, 255, 1, 2])], "sample.pdf", { type: "application/pdf" }));
    const parsed = await readBoundedFormData(new Request(url, { method: "POST", body: form }), 4096);
    expect(parsed.get("deliveryId")).toBe("delivery-1");
    const file = parsed.get("file") as File;
    expect(file.name).toBe("sample.pdf");
    expect([...new Uint8Array(await file.arrayBuffer())]).toEqual([0, 255, 1, 2]);
  });

  it("retains form-urlencoded support for ordinary HTML forms", async () => {
    const request = new Request(url, { method: "POST", body: "title=A%20B&notes=ok",
      headers: { "content-type": "application/x-www-form-urlencoded" } });
    const form = await readBoundedFormData(request, 64);
    expect(form.get("title")).toBe("A B");
    expect(form.get("notes")).toBe("ok");
  });

  it("rejects a declared oversized body before consuming the request stream", async () => {
    const request = streamRequest(new Uint8Array([1]), {
      "content-type": "application/x-www-form-urlencoded", "content-length": "5000000",
    });
    await expect(readBoundedFormData(request, 50)).rejects.toEqual(bad("BODY_TOO_LARGE"));
    expect(request.bodyUsed).toBe(false);
  });

  it("rejects oversized streamed data despite forged small Content-Length", async () => {
    const request = streamRequest(new Uint8Array(200), {
      "content-type": "application/x-www-form-urlencoded", "content-length": "1",
    });
    await expect(readBoundedFormData(request, 64)).rejects.toEqual(bad("BODY_TOO_LARGE"));
  });

  it("rejects oversized chunked multipart requests without Content-Length", async () => {
    const request = streamRequest(new Uint8Array(200), {
      "content-type": "multipart/form-data; boundary=abc",
    });
    await expect(readBoundedFormData(request, 64)).rejects.toEqual(bad("BODY_TOO_LARGE"));
  });

  it("rejects malformed MIME, missing boundary, invalid lengths and truncated multipart", async () => {
    const invalid = [
      { "content-type": "text/plain" },
      { "content-type": "multipart/form-data" },
      { "content-type": "multipart/form-data; boundary=abc", "content-length": "infinity" },
      { "content-type": "application/x-www-form-urlencoded", "content-length": "9007199254740994" },
    ];
    for (const headers of invalid) {
      await expect(readBoundedFormData(streamRequest(new Uint8Array([65]), headers), 64))
        .rejects.toEqual(bad("INVALID_FORM"));
    }
    await expect(readBoundedFormData(streamRequest(new Uint8Array([65]), {
      "content-type": "multipart/form-data; boundary=abc",
    }), 64)).rejects.toEqual(bad("INVALID_FORM"));
    await expect(readBoundedFormData(new Request(url, { method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" } }), 64))
      .rejects.toEqual(bad("INVALID_FORM"));
  });

  it("never turns invalid caps into unlimited body reads", async () => {
    for (const cap of [0, -1, NaN, Infinity, 32 * 1024 * 1024 + 1]) {
      await expect(readBoundedFormData(new Request(url), cap))
        .rejects.toThrow("INVALID_FORM_BODY_LIMIT");
    }
    expect(BoundedFormDataError.name).toBe("BoundedFormDataError");
  });
});

describe("live route integration contract", () => {
  const routes = [
    "src/app/api/courses/assignments/[assignmentId]/file-upload/route.ts",
    "src/app/api/placements/tpo/jobs/[jobId]/rounds/[roundId]/import-results/route.ts",
    "src/app/api/placements/recorded-outside/route.ts",
  ];
  for (const path of routes) {
    it("enforces streamed body cap before form parsing on " + path, () => {
      const src = readFileSync(path, "utf8");
      expect(src).toContain("readBoundedFormData(request,");
      expect(src).not.toContain("request.formData()");
    });
  }
  it("bounds assignment JSON presign declarations too", () => {
    const src = readFileSync(routes[0]!, "utf8");
    expect(src).toContain("readBoundedUtf8Body(request, 8 * 1024)");
    expect(src).not.toContain("await request.json()");
  });
});
