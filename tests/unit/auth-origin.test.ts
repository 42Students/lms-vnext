import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/auth/origin";

describe("auth same-origin guard", () => {
  it("accepts the public origin behind a trusted proxy", () => {
    const request = new Request(
      "http://internal-service/api/auth/session",
      {
        method: "POST",
        headers: {
          origin: "https://lms.example.com",
          "x-forwarded-host": "lms.example.com",
          "x-forwarded-proto": "https",
          host: "lms.example.com",
        },
      },
    );

    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects forwarded host spoofing without a matching actual Host", () => {
    const request = new Request("http://internal-service/api/auth/session",{
      method:"POST",
      headers:{origin:"https://lms.example.com",
        "x-forwarded-host":"lms.example.com","x-forwarded-proto":"https",
        host:"internal-service"},
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("rejects a foreign origin", () => {
    const request = new Request(
      "https://lms.example.com/api/auth/session",
      {
        method: "POST",
        headers: {
          origin: "https://evil.example",
          host: "lms.example.com",
        },
      },
    );

    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("fails closed when the browser sends no origin", () => {
    const request = new Request(
      "https://lms.example.com/api/auth/session",
      {
        method: "POST",
        headers: {
          host: "lms.example.com",
        },
      },
    );

    expect(isSameOriginRequest(request)).toBe(false);
  });
  it("allows genuine local HTTP origins, including IPv6 loopback and explicit ports", () => {
    for (const authority of ["localhost:3000", "127.0.0.1:3000", "[::1]:3000"]) {
      const request = new Request(`http://${authority}/api/auth/session`, {
        method: "POST",
        headers: { origin: `http://${authority}`, host: authority },
      });
      expect(isSameOriginRequest(request)).toBe(true);
    }
  });

  it("does not treat attacker-controlled loopback-looking domains as local", () => {
    for (const authority of ["localhost.attacker.test", "127.0.0.1.attacker.test"]) {
      const request = new Request(`http://${authority}/api/auth/session`, {
        method: "POST",
        headers: { origin: `http://${authority}`, host: authority },
      });
      expect(isSameOriginRequest(request)).toBe(false);
    }
  });

  it("rejects Host values whose URL parsing would discard an authority component", () => {
    for (const host of [
      "user@lms.example.com",
      "lms.example.com/path",
      "lms.example.com?query=1",
      "lms.example.com#fragment",
      "lms%2Eexample.com",
    ]) {
      const request = new Request("https://lms.example.com/api/auth/session", {
        method: "POST",
        headers: { origin: "https://lms.example.com", host },
      });
      expect(isSameOriginRequest(request), host).toBe(false);
    }
  });

  it("preserves HTTPS custom-host ports and ignores spoofed forwarded-host", () => {
    const request = new Request("http://internal-service/api/auth/session", {
      method: "POST",
      headers: {
        origin: "https://college.example.com:8443",
        host: "college.example.com:8443",
        "x-forwarded-host": "attacker.example",
      },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

});
