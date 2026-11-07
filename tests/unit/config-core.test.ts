import { describe, expect, it } from "vitest";
import { checkSecrets, type SecretSpec } from "@/security/config-core";
import { SECRET_REGISTRY, validateSecretConfig } from "@/security/secret-registry";

const secret: SecretSpec = { name: "S1", purpose: "p", kind: "secret", minBytes: 32, requiredInProduction: true, distinct: true };
const secret2: SecretSpec = { ...secret, name: "S2" };
const key: SecretSpec = { name: "K1", purpose: "p", kind: "base64-key", bytes: 32, requiredInProduction: true, distinct: true };
const good = "g".repeat(10) + "Qx7!".repeat(8);
const goodKey = Buffer.alloc(32, 7).toString("base64");

describe("secret configuration checks", () => {
  it("requires secrets in production but only validates them elsewhere", () => {
    expect(checkSecrets({}, [secret], true).map((i) => i.code)).toEqual(["MISSING"]);
    expect(checkSecrets({}, [secret], false)).toEqual([]);
  });

  it("rejects short values and placeholders without echoing the value", () => {
    const short = checkSecrets({ S1: "short-but-real" }, [secret], false);
    expect(short[0]?.code).toBe("TOO_SHORT");
    for (const v of ["changeme", "password", "your-secret-here", "<fill-me>", "aaaa"]) {
      const out = checkSecrets({ S1: v }, [secret], false);
      expect(out[0]?.code).toBe("PLACEHOLDER");
      expect(out[0]?.message).not.toContain(v);
    }
  });

  it("accepts a strong secret and a 32-byte base64 key", () => {
    expect(checkSecrets({ S1: good, K1: goodKey }, [secret, key], true)).toEqual([]);
  });

  it("rejects keys of the wrong length or alphabet", () => {
    expect(checkSecrets({ K1: Buffer.alloc(16, 7).toString("base64") }, [key], false)[0]?.code).toBe("BAD_KEY");
    expect(checkSecrets({ K1: "not base64 !!" }, [key], false)[0]?.code).toBe("BAD_KEY");
  });

  it("flags one value reused for two secrets", () => {
    const out = checkSecrets({ S1: good, S2: good }, [secret, secret2], false);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ name: "S2", code: "REUSED" });
    expect(out[0]?.message).not.toContain(good);
  });
});

describe("secret registry", () => {
  it("names every internalRoute credential used by the code", async () => {
    const { execSync } = await import("node:child_process");
    const used = execSync('git grep -ho "secretEnv: *\\"[A-Z0-9_]*\\"" src', { encoding: "utf8" })
      .split("\n").filter(Boolean).map((l) => /"([A-Z0-9_]+)"/.exec(l)![1]);
    const known = new Set(SECRET_REGISTRY.map((s) => s.name));
    expect(used.filter((n) => !known.has(n!))).toEqual([]);
  });

  it("has unique names and the validator never throws on an empty environment", () => {
    expect(new Set(SECRET_REGISTRY.map((s) => s.name)).size).toBe(SECRET_REGISTRY.length);
    expect(validateSecretConfig({ NODE_ENV: "production" }).length).toBe(SECRET_REGISTRY.filter((s) => s.requiredInProduction).length);
    expect(validateSecretConfig({})).toEqual([]);
  });
});
