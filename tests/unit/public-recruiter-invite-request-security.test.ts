import { describe, expect, it } from "vitest";
import { validateNoArgumentRecruiterInvitePost } from "@/modules/placements/public-recruiter-invite-request";

const url = "https://college.example.edu/api/public/recruiter-invite/valid-token/opened";
function makeRequest(body?: BodyInit, contentType = "application/json", path = url) {
  return new Request(path, {
    method: "POST",
    headers: { "content-type": contentType },
    ...(body === undefined ? {} : { body }),
  });
}

describe("public recruiter invite no-argument body gate", () => {
  it("allows the intended empty POST", async () => {
    expect(await validateNoArgumentRecruiterInvitePost(makeRequest())).toBe("OK");
  });

  it("retains the legacy empty JSON object sent by older clients", async () => {
    expect(await validateNoArgumentRecruiterInvitePost(makeRequest("{}"))).toBe("OK");
    expect(await validateNoArgumentRecruiterInvitePost(makeRequest("  {}  "))).toBe("OK");
  });

  it("rejects a query string rather than letting clients supply hidden action selectors", async () => {
    expect(await validateNoArgumentRecruiterInvitePost(
      makeRequest(undefined, "application/json", url + "?collegeId=foreign"),
    )).toBe("INVALID");
  });

  it("rejects extra JSON fields, arrays, primitives and non-JSON objects", async () => {
    for (const body of ['{"role":"SUPER_ADMIN"}', "[]", "true", "null", '"text"']) {
      expect(await validateNoArgumentRecruiterInvitePost(makeRequest(body))).toBe("INVALID");
    }
    expect(await validateNoArgumentRecruiterInvitePost(
      makeRequest("{}", "text/plain"),
    )).toBe("INVALID");
  });

  it("caps streamed bodies independent of the Content-Length header", async () => {
    const request = makeRequest(" ".repeat(257));
    request.headers.set("content-length", "0");
    expect(await validateNoArgumentRecruiterInvitePost(request)).toBe("TOO_LARGE");
  });

  it("rejects malformed and invalid UTF-8 instead of normalizing it", async () => {
    expect(await validateNoArgumentRecruiterInvitePost(makeRequest("{"))).toBe("INVALID");
    const invalidBytes = new Uint8Array([0xc3, 0x28]).buffer as ArrayBuffer;
    expect(await validateNoArgumentRecruiterInvitePost(makeRequest(invalidBytes))).toBe("INVALID");
  });
});
