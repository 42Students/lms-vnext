import { normalizeSignature, sha256Hex, sha256HexSync, signatureHash, summaryMessage } from "../logSignature";
import { frameLabel, frameLink, loggerSearchLink, parseAppFrames } from "../logSourceLinks";

// Reference values were produced by running the backend's own LogSignatureUtil (Java) on the same
// inputs. If this file fails, the browser no longer matches the stored error signatures and fix
// status stops attaching to error groups.
const JAVA_VECTORS = [
  {
    message: 'Unhandled exception: 502 BAD_GATEWAY "Cloud Logging query failed"',
    path: "/api/v1/superadmin/logs/query",
    normalized: 'unhandled exception: <n> bad_gateway "cloud logging query failed"@/api/v1/superadmin/logs/query',
    hash: "84a9af91036f7e407e13ba6dea5c17a17a478f238793fd20ad345e9d1938f9bc",
  },
  {
    message: "Logout: error blocklisting refresh token",
    path: "/api/v1/auth/logout",
    normalized: "logout: error blocklisting refresh token@/api/v1/auth/logout",
    hash: "090cf3553f8905a80dda5c35968ddf6348795e90bd42af91bc15e7d3e66c4f88",
  },
  {
    message: "Boom 42 for user a@b.com id 33c5d710-0557-4dcc-b165-c828cbda001b",
    path: "/api/v1/quizzes/96/submit",
    normalized: "boom <n> for user <email> id <uuid>@/api/v1/quizzes/<id>/submit",
    hash: "71c6206322a5ed1558cfb83355221f69c25243a44d81921c1d8b0ea285787e56",
  },
  {
    message: "  Multiple   spaces\nand newline ",
    path: null,
    normalized: "multiple spaces and newline",
    hash: "09302b1ecff1621f5a4095d7bfc186c494a961de591ba2d50fb47d40373e6861",
  },
  {
    message: null,
    path: "/api/v1/courses/crs-mig28-u9ZzYJra1M9O/lessons/12",
    normalized: "@/api/v1/courses/crs-mig28-u9zzyjra1m9o/lessons/<id>",
    hash: "af47154355d8ea2ac38b448c4d202f8624de7169635be32c12fe27305b0ca0cd",
  },
];

describe("signature parity with the backend", () => {
  test.each(JAVA_VECTORS)("normalizes and hashes like Java: $normalized", async ({ message, path, normalized, hash }) => {
    expect(normalizeSignature(message, path)).toBe(normalized);
    expect(await signatureHash({ message, httpPath: path })).toBe(hash);
  });

  test("sha256Hex is a real SHA-256", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  test("the pure-JS fallback agrees with the reference vectors, including multi-block and non-ascii input", () => {
    expect(sha256HexSync("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(sha256HexSync("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(sha256HexSync("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))
      .toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
    expect(sha256HexSync("é".repeat(100))).toBe(require("crypto").createHash("sha256").update("é".repeat(100), "utf8").digest("hex"));
    JAVA_VECTORS.forEach(({ normalized, hash }) => expect(sha256HexSync(normalized)).toBe(hash));
  });

  test("long messages are cut to the list view's 1500 characters plus an ellipsis before hashing", () => {
    const long = "x".repeat(2000);
    expect(summaryMessage(long)).toHaveLength(1501);
    expect(summaryMessage(long).endsWith("…")).toBe(true);
    expect(normalizeSignature(long, null)).toBe(normalizeSignature(long.slice(0, 1500) + "…", null));
    expect(summaryMessage("short")).toBe("short");
  });
});

const STACK = [
  "org.springframework.web.server.ResponseStatusException: 429 TOO_MANY_REQUESTS",
  "\tat com._42students.lms.controller.PublicTrackerLogsAccessController.verify(PublicTrackerLogsAccessController.java:71)",
  "\tat java.base/jdk.internal.reflect.NativeMethodAccessorImpl.invoke0(Native Method)",
  "\tat org.springframework.web.method.support.InvocableHandlerMethod.doInvoke(InvocableHandlerMethod.java:205)",
  "\tat com._42students.lms.service.impl.NotificationSchedulerService.sendAssignmentDueReminders(NotificationSchedulerService.java:156)",
].join("\n");

describe("source links", () => {
  test("keeps only application frames and derives the repository path", () => {
    const frames = parseAppFrames(STACK);
    expect(frames).toHaveLength(2);
    expect(frames[0]).toMatchObject({
      className: "PublicTrackerLogsAccessController",
      method: "verify",
      line: 71,
      path: "src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java",
    });
    expect(frames[1].path).toBe("src/main/java/com/_42students/lms/service/impl/NotificationSchedulerService.java");
  });

  test("links to the exact line, pinned to a commit when given", () => {
    const [frame] = parseAppFrames(STACK);
    expect(frameLink(frame)).toBe(
      "https://github.com/42Students/lms/blob/prod-2026/src/main/java/com/_42students/lms/controller/PublicTrackerLogsAccessController.java#L71"
    );
    expect(frameLink(frame, "abc1234")).toContain("/blob/abc1234/");
    expect(frameLabel(frame)).toBe("PublicTrackerLogsAccessController.java:71 (PublicTrackerLogsAccessController.verify)");
  });

  test("nothing to link when there is no stack, and inner classes still resolve to their file", () => {
    expect(parseAppFrames(null)).toEqual([]);
    expect(parseAppFrames("plain text with no frames")).toEqual([]);
    const inner = parseAppFrames("\tat com._42students.lms.service.Foo$Bar.run(Foo.java:9)");
    expect(inner[0].path).toBe("src/main/java/com/_42students/lms/service/Foo.java");
    expect(frameLink(null)).toBeNull();
  });

  test("falls back to a code search for a logger name", () => {
    expect(loggerSearchLink("c._.l.s.i.NotificationSchedulerService")).toContain("q=NotificationSchedulerService");
    expect(loggerSearchLink(null)).toBeNull();
  });

  test("the frame limit is honoured", () => {
    const many = Array.from({ length: 9 }, (_, i) => `\tat com._42students.lms.a.B.m${i}(B.java:${i + 1})`).join("\n");
    expect(parseAppFrames(many, 3)).toHaveLength(3);
  });
});
