import { describe, expect, it } from "vitest";
import {
  awsEncode,
  presignUrl,
  signingKey,
} from "@/modules/storage/s3-client";

describe("SigV4 primitives (AWS published test vectors)", () => {
  it("derives the documented signing key", () => {
    const key = signingKey(
      "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
      "20120215",
      "us-east-1",
      "iam",
    );
    expect(key.toString("hex")).toBe(
      "f4780e2d9f65fa895f9c67b32ce1baf0b0d8a43505a000a1a9e090d414db404d",
    );
  });

  it("produces the documented presigned GET signature", () => {
    const url = presignUrl(
      {
        endpoint: "https://examplebucket.s3.amazonaws.com",
        bucket: "",
        accessKeyId: "AKIAIOSFODNN7EXAMPLE",
        secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        region: "us-east-1",
      },
      {
        method: "GET",
        key: "test.txt",
        now: new Date("2013-05-24T00:00:00Z"),
        expiresSeconds: 86400,
      },
    );
    expect(url).toContain(
      "X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404",
    );
  });

  it("encodes reserved characters strictly", () => {
    expect(awsEncode("a b/c!'()*")).toBe("a%20b%2Fc%21%27%28%29%2A");
  });
});

describe("R2 presigned URLs", () => {
  const config = {
    endpoint: "https://acct.r2.cloudflarestorage.com",
    bucket: "lms",
    accessKeyId: "id",
    secretAccessKey: "secret",
  };

  it("is path-style and binds extra signed headers", () => {
    const url = new URL(
      presignUrl(config, {
        method: "PUT",
        key: "private/a/b",
        headers: { "Content-Type": "application/pdf" },
      }),
    );
    expect(url.pathname).toBe("/lms/private/a/b");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe(
      "content-type;host",
    );
    expect(url.searchParams.get("X-Amz-Credential")).toMatch(
      /^id\/\d{8}\/auto\/s3\/aws4_request$/,
    );
  });

  it("changes the signature when a bound header changes", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    const sign = (type: string) =>
      new URL(
        presignUrl(config, {
          method: "PUT",
          key: "k",
          now,
          headers: { "content-type": type },
        }),
      ).searchParams.get("X-Amz-Signature");
    expect(sign("image/png")).not.toBe(sign("application/pdf"));
  });
});
