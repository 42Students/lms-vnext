import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import { readBoundedJsonBody } from "@/lib/request-body";

const mocks = vi.hoisted(() => ({
  origin: vi.fn(), context: vi.fn(),
  create: vi.fn(), update: vi.fn(), restore: vi.fn(), archive: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/auth/origin", () => ({ isSameOriginRequest: mocks.origin }));
vi.mock("@/auth/request-context", () => ({
  getCurrentRequestContext: mocks.context,
}));
vi.mock("@/modules/academics/college-program-mutation-service", () => ({
  CollegeProgramMutationError: class CollegeProgramMutationError extends Error {
    code = "CONFLICT";
  },
  createCollegeProgram: mocks.create,
  updateCollegeProgram: mocks.update,
  restoreCollegeProgram: mocks.restore,
  archiveCollegeProgram: mocks.archive,
}));
vi.mock("@/lib/api-error", () => ({
  apiErrorResponse: () => NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 }),
}));

import { POST as createProgram } from "@/app/api/academics/programs/route";
import {
  PATCH as updateProgram,
  DELETE as archiveProgram,
} from "@/app/api/academics/programs/[programId]/route";
import { PUT as updateLegacyProgram } from "@/app/api/v1/new-program/[...action]/route";

const id = "11111111-1111-4111-8111-111111111111";
const base = "https://college.example.test";
const large = JSON.stringify({ name: "x".repeat(16_385) });
const small = { name: "Engineering", code: "ENG", departmentId: id, durationTerms: 8 };
const ctx = { user: { id: "22222222-2222-4222-8222-222222222222" } };

const make = (method: string, path: string, body: string) => new Request(base + path, {
  method,
  headers: {
    host: "college.example.test",
    origin: base,
    "content-type": "application/json",
  },
  body,
});
const detail = { params: Promise.resolve({ programId: id }) };
const legacyDetail = { params: Promise.resolve({ action: ["update", id] }) };
const noMutation = () => {
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.restore).not.toHaveBeenCalled();
  expect(mocks.archive).not.toHaveBeenCalled();
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.origin.mockReturnValue(true);
  mocks.context.mockResolvedValue(ctx);
  mocks.create.mockResolvedValue({ id });
  mocks.update.mockResolvedValue({ id });
  mocks.archive.mockResolvedValue({ id });
  mocks.restore.mockResolvedValue({ id });
});

describe("stream bounded JSON parser", () => {
  it("does not trust an understated Content-Length header", async () => {
    const request = make("POST", "/api/academics/programs", large);
    request.headers.set("content-length", "1");
    expect((await readBoundedJsonBody(request, 16_384)).kind).toBe("TOO_LARGE");
  });

  it("accepts valid input and rejects malformed JSON without throwing", async () => {
    const ok = await readBoundedJsonBody(make("POST", "/api", JSON.stringify(small)), 16_384);
    expect(ok).toEqual({ kind: "OK", value: small });
    expect((await readBoundedJsonBody(make("POST", "/api", "{"), 16_384)).kind)
      .toBe("INVALID");
  });
});

describe("academic program mutation request-size enforcement", () => {
  it("rejects oversized create requests before the service is called", async () => {
    const result = await createProgram(make("POST", "/api/academics/programs", large));
    expect(result.status).toBe(413);
    expect(result.headers.get("cache-control")).toBe("no-store");
    noMutation();
  });

  it("rejects oversized updates before the service is called", async () => {
    const result = await updateProgram(
      make("PATCH", "/api/academics/programs/" + id, large), detail,
    );
    expect(result.status).toBe(413);
    noMutation();
  });

  it("rejects oversized archives before the service is called", async () => {
    const result = await archiveProgram(
      make("DELETE", "/api/academics/programs/" + id, large), detail,
    );
    expect(result.status).toBe(413);
    noMutation();
  });

  it("rejects oversized v1 compatibility updates before fetching a target", async () => {
    const result = await updateLegacyProgram(
      make("PUT", "/api/v1/new-program/update/" + id, large), legacyDetail,
    );
    expect(result.status).toBe(413);
    noMutation();
  });

  it("rejects malformed JSON with 400 and zero mutation calls", async () => {
    const result = await updateProgram(
      make("PATCH", "/api/academics/programs/" + id, "{"), detail,
    );
    expect(result.status).toBe(400);
    noMutation();
  });

  it("preserves the authorized create, update and archive paths", async () => {
    const created = await createProgram(
      make("POST", "/api/academics/programs", JSON.stringify(small)),
    );
    expect(created.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith(ctx, small);

    const updated = await updateProgram(
      make("PATCH", "/api/academics/programs/" + id, JSON.stringify(small)), detail,
    );
    expect(updated.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(ctx, id, small);

    const archived = await archiveProgram(
      make("DELETE", "/api/academics/programs/" + id, JSON.stringify({ confirm: true })),
      detail,
    );
    expect(archived.status).toBe(200);
    expect(mocks.archive).toHaveBeenCalledWith(ctx, id, { confirm: true });
  });

  it("rejects cross-origin mutations before parsing and writing", async () => {
    mocks.origin.mockReturnValue(false);
    const result = await createProgram(
      make("POST", "/api/academics/programs", JSON.stringify(small)),
    );
    expect(result.status).toBe(403);
    expect(mocks.context).not.toHaveBeenCalled();
    noMutation();
  });
});
