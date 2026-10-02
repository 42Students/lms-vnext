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
