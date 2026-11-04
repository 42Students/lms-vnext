import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import {
  MAX_STORAGE_JSON_BYTES,
  readJsonBody,
  readOptionalJsonBody,
} from "@/lib/storage-route";
import { StorageFileError } from "@/modules/storage/file-errors";

function request(body?: BodyInit, headers?: HeadersInit) {
  return new Request("https://lms.example/api/projects/files", {
    method: "POST",
    headers,
    ...(body === undefined ? {} : { body }),
  });
}

async function expectTooLarge(body: BodyInit, headers?: HeadersInit) {
  await expect(readJsonBody(request(body, headers))).rejects.toMatchObject({
    name: "StorageFileError",
    code: "STORAGE_FILE_TOO_LARGE",
    status: 413,
  });
  await expect(readOptionalJsonBody(request(body, headers))).rejects.toMatchObject({
    name: "StorageFileError",
    code: "STORAGE_FILE_TOO_LARGE",
    status: 413,
  });
}

describe("shared storage metadata JSON boundary", () => {
  it("accepts ordinary object metadata in both required and optional flows", async () => {
    const input = { fileName: "safe.pdf", size: 32, metadata: { origin: "assignment" } };
    expect(await readJsonBody(request(JSON.stringify(input)))).toEqual(input);
    expect(await readOptionalJsonBody(request(JSON.stringify(input)))).toEqual(input);
  });

  it("enforces exactly 64 KiB of UTF-8 bytes, including the boundary", async () => {
    const overhead = Buffer.byteLength(JSON.stringify({ x: "" }), "utf8");
    const exact = JSON.stringify({ x: "a".repeat(MAX_STORAGE_JSON_BYTES - overhead) });
    expect(Buffer.byteLength(exact, "utf8")).toBe(MAX_STORAGE_JSON_BYTES);
    const parsed = await readJsonBody(request(exact));
    expect((parsed as { x: string }).x.length).toBe(MAX_STORAGE_JSON_BYTES - overhead);
    await expectTooLarge(exact + " ");
  });

  it("does not trust a forged Content-Length: 0 header", async () => {
    const tooLarge = JSON.stringify({ x: "x".repeat(MAX_STORAGE_JSON_BYTES) });
    await expectTooLarge(tooLarge, { "content-length": "0" });
  });

  it("rejects excess UTF-8 bytes even when character count is below the cap", async () => {
    const multiByte = JSON.stringify({ x: "é".repeat(MAX_STORAGE_JSON_BYTES / 2) });
    expect(multiByte.length).toBeLessThan(MAX_STORAGE_JSON_BYTES);
    await expectTooLarge(multiByte);
  });

  it("rejects invalid UTF-8 rather than replacing invalid byte sequences", async () => {
    const bytes = new Uint8Array([0x7b, 0x22, 0x78, 0x22, 0x3a, 0x22, 0xc3, 0x28, 0x22, 0x7d]);
    await expect(readJsonBody(request(bytes.buffer as ArrayBuffer))).rejects.toBeInstanceOf(ZodError);
    await expect(readOptionalJsonBody(request(bytes.buffer as ArrayBuffer))).rejects.toBeInstanceOf(ZodError);
  });

  it("preserves optional empty-body and whitespace-body compatibility", async () => {
    expect(await readOptionalJsonBody(request())).toEqual({});
    expect(await readOptionalJsonBody(request(""))).toEqual({});
    expect(await readOptionalJsonBody(request("  \n\t "))).toEqual({});
    await expect(readJsonBody(request())).rejects.toBeInstanceOf(ZodError);
  });

  it("does not accept primitive or array JSON as metadata", async () => {
    for (const value of ["null", "1", "true", "\"\"", "[]", "[{}]"]) {
      await expect(readJsonBody(request(value))).rejects.toBeInstanceOf(ZodError);
      await expect(readOptionalJsonBody(request(value))).rejects.toBeInstanceOf(ZodError);
    }
  });

  it("reports malformed JSON as a safe validation failure", async () => {
    await expect(readJsonBody(request("{untrusted"))).rejects.toBeInstanceOf(ZodError);
    await expect(readOptionalJsonBody(request("{untrusted"))).rejects.toBeInstanceOf(ZodError);
  });

  it("uses the existing typed 413 error contract for the oversized body", async () => {
    const huge = request("x".repeat(MAX_STORAGE_JSON_BYTES + 1));
    try {
      await readJsonBody(huge);
      throw new Error("expected an oversized body error");
    } catch (error) {
      expect(error).toBeInstanceOf(StorageFileError);
      if (error instanceof StorageFileError) {
        expect(error.code).toBe("STORAGE_FILE_TOO_LARGE");
        expect(error.status).toBe(413);
      }
    }
  });
});
