import { describe, expect, it } from "vitest";
import { BASE_SECURITY_HEADERS } from "@/security/headers";

describe("baseline HTTP security headers", () => {
  const values = new Map(
    BASE_SECURITY_HEADERS.map((header) => [
      header.key,
      header.value,
    ]),
  );

  it("prevents MIME sniffing and clickjacking", () => {
    expect(values.get("X-Content-Type-Options")).toBe(
      "nosniff",
    );
    expect(values.get("X-Frame-Options")).toBe("DENY");
  });

  it("limits referrer and unused browser capabilities", () => {
    expect(values.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin",
    );
    expect(values.get("Permissions-Policy")).toContain(
      "camera=()",
    );
    expect(values.get("Permissions-Policy")).toContain(
      "microphone=()",
    );
    expect(values.get("Permissions-Policy")).toContain(
      "geolocation=()",
    );
  });
});

describe("content security policy and transport security", () => {
  const values = new Map(
    BASE_SECURITY_HEADERS.map((header) => [
      header.key,
      header.value,
    ]),
  );
  const csp = String(values.get("Content-Security-Policy"));

  it("locks down framing, plugins, base URI and form targets", () => {
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("default-src 'self'");
  });

  it("only allows scripts from this origin and never plain http", () => {
    expect(csp).toMatch(/script-src 'self'/);
    expect(csp).not.toContain("http:");
    expect(csp).not.toMatch(/script-src[^;]*\*/);
  });

  it("allows only the YouTube origins needed for lesson embeds", () => {
    expect(csp).toMatch(
      /script-src 'self' 'unsafe-inline' https:\/\/www\.youtube\.com( 'unsafe-eval')?;/,
    );
    expect(csp).toContain(
      "frame-src https://www.youtube.com https://www.youtube-nocookie.com;",
    );
    expect(csp).toContain("connect-src 'self';");
    expect(csp).not.toMatch(/script-src[^;]*youtube-nocookie/);
  });

  it("sends HSTS", () => {
    expect(values.get("Strict-Transport-Security")).toMatch(
      /max-age=\d{7,}/,
    );
  });
});
