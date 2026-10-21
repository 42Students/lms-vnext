// BE-0188: AI grading trusts only the backend's verdict on the session, never a decoded cookie.
// BE-0189: one request has a hard size, question and concurrency envelope before any paid work.
import { Readable } from "stream";
import { verifyAiGradingAccess } from "@/utils/apiAuth";
import handler, { LIMITS, normalizeExam, readRequestBuffer, RequestError } from "@/pages/api/ai-grading/grade-booklet";

// The repo jest setup needs jsdom, whose AbortSignal may lack timeout(); Node (where the route runs) has it.
if (typeof AbortSignal.timeout !== "function") AbortSignal.timeout = () => undefined;

const forged = (claims) => `x.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.y`;

function mockRes() {
  const res = { statusCode: 200, body: null, headers: {} };
  res.status = (c) => ((res.statusCode = c), res);
  res.json = (b) => ((res.body = b), res);
  res.setHeader = (k, v) => (res.headers[k] = v);
  return res;
}

function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

describe("verifyAiGradingAccess", () => {
  afterEach(() => {
    delete global.fetch;
  });

  it("refuses without a cookie and never asks the backend", async () => {
    global.fetch = jest.fn();
    expect(await verifyAiGradingAccess({ cookies: {} })).toMatchObject({ ok: false, status: 401 });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("a forged cookie is only as good as the backend says (here: refused)", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(401, { error: "Unauthorized" }));
    const r = await verifyAiGradingAccess({ cookies: { lms_authenticated: forged({ userType: "FACULTY", exp: 9999999999 }) } });
    expect(r).toMatchObject({ ok: false, status: 401 });
    const [url, init] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/v1\/auth\/ai-grading-access$/);
    expect(init.headers.Cookie).toMatch(/^lms_authenticated=/);
  });

  it("passes on the backend's 403 and 429, and spends only when asked", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce(jsonResponse(403, { error: "AI grading is for faculty and admins." }));
    expect(await verifyAiGradingAccess({ cookies: { lms_authenticated: "a.b.c" } })).toMatchObject({ ok: false, status: 403 });
    global.fetch = jest.fn().mockResolvedValueOnce(jsonResponse(429, { error: "used up" }));
    const r = await verifyAiGradingAccess({ cookies: { lms_authenticated: "a.b.c" } }, { use: true });
    expect(r).toMatchObject({ ok: false, status: 429, error: "used up" });
    expect(global.fetch.mock.calls[0][0]).toMatch(/\?use=true$/);
  });

  it("fails closed when the backend can't be reached", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    expect(await verifyAiGradingAccess({ cookies: { lms_authenticated: "a.b.c" } })).toMatchObject({ ok: false, status: 503 });
  });

  it("returns the verified user", async () => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, { userId: 7, userType: "FACULTY", remainingToday: 25 }));
    expect(await verifyAiGradingAccess({ cookies: { lms_authenticated: "a.b.c" } })).toEqual({
      ok: true,
      user: { userId: 7, userType: "FACULTY", remainingToday: 25 },
    });
  });
});

describe("grade-booklet envelope", () => {
  const q = (over = {}) => ({ id: "1", text: "Explain", rubric: "points", max_marks: 5, ...over });

  it("caps the question list and each field", () => {
    expect(() => normalizeExam({ questions: Array.from({ length: LIMITS.questions + 1 }, (_, i) => q({ id: String(i) })) })).toThrow(RequestError);
    expect(() => normalizeExam({ questions: [q({ text: "x".repeat(LIMITS.textChars + 1) })] })).toThrow(/question text/);
    expect(() => normalizeExam({ questions: [q({ rubric: "x".repeat(LIMITS.rubricChars + 1) })] })).toThrow(/rubric/);
    expect(() => normalizeExam({ questions: [q({ max_marks: LIMITS.maxMarks + 1 })] })).toThrow(/max marks/);
    const exam = normalizeExam({ questions: [q({ extra: "dropped", label_hints: Array(100).fill("h") })], junk: "x".repeat(10) });
    expect(exam.junk).toBeUndefined();
    expect(exam.questions[0].extra).toBeUndefined();
  });

  it("refuses an oversized body by its declared length and while streaming", async () => {
    await expect(readRequestBuffer({ headers: { "content-length": String(LIMITS.bodyBytes + 1) } })).rejects.toMatchObject({ status: 413 });
    const stream = Readable.from([Buffer.alloc(600), Buffer.alloc(600)]);
    stream.headers = {};
    await expect(readRequestBuffer(stream, 1000)).rejects.toMatchObject({ status: 413 });
    const small = Readable.from([Buffer.from("ok")]);
    small.headers = {};
    expect((await readRequestBuffer(small, 1000)).toString()).toBe("ok");
  });

  it("the route refuses a forged cookie before reading the upload or calling OpenAI", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(401, {}));
    const req = { method: "POST", headers: {}, cookies: { lms_authenticated: forged({ exp: 9999999999 }) } };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(global.fetch).toHaveBeenCalledTimes(1); // only the backend check
    delete global.fetch;
    delete process.env.OPENAI_API_KEY;
  });
});
