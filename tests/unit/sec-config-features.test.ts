import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ENV_KIND, ENV_NAMES } from "@/config/env-names";
import { FEATURE_KEYS, FEATURES, featureFlagName, featureReady } from "@/config/features";

/**
 * Each deployment-readiness flag is defined once, with the exact value that turns it on. Call sites ask `featureReady(key)`;
 * they never compare the variable to a literal, so a typo or an inverted test cannot hide a path that is never (or always) on.
 */
const root = process.cwd();
const walk = (dir: string, out: string[] = []): string[] => {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
};
const rel = (file: string) => path.relative(root, file).split(path.sep).join("/");

describe("the feature table", () => {
  const touched: string[] = [];
  afterEach(() => {
    for (const name of touched.splice(0)) delete process.env[name];
  });
  const set = (name: string, value: string | undefined) => {
    touched.push(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };

  it("covers every readiness flag the source knows about, and nothing else", () => {
    const flags = (ENV_NAMES as readonly string[]).filter((name) => ENV_KIND[name as keyof typeof ENV_KIND] === "flag");
    const defined = FEATURE_KEYS.map((key) => featureFlagName(key) as string);
    expect(defined.filter((flag) => !flags.includes(flag)), "a feature points at a variable that is not a registered flag").toEqual([]);
    expect(flags.filter((flag) => !defined.includes(flag)), "a registered flag has no feature entry").toEqual([]);
    expect(new Set(defined).size, "two features share one variable").toBe(defined.length);
  });

  it("is on only for the exact expected value", () => {
    for (const key of FEATURE_KEYS) {
      const { flag, on } = FEATURES[key];
      set(flag, undefined);
      expect(featureReady(key), key + " unset").toBe(false);
      for (const wrong of ["", "on", "true ", " " + on, on.toLowerCase() === on ? on.toUpperCase() : on.toLowerCase(), on + "_X", "yes", "1"]) {
        if (wrong === on) continue;
        set(flag, wrong);
        expect(featureReady(key), `${key}=${JSON.stringify(wrong)}`).toBe(false);
      }
      set(flag, on);
      expect(featureReady(key), key + " exact").toBe(true);
    }
  });

  it("harness switches are marked, and every harness flag is a harness switch", () => {
    const harness = FEATURE_KEYS.filter((key) => (FEATURES[key] as { harness?: true }).harness === true);
    expect(harness.map((key) => FEATURES[key].flag).sort()).toEqual(["APP_E2E_SEED_ENABLED", "E2E_AUTH_ENABLED", "E2E_SEED_ENABLED"]);
    for (const key of harness) expect(FEATURES[key].area).toBe("harness");
  });
});

describe("nothing compares a readiness flag to a literal", () => {
  it("no source file outside src/config tests a registered flag with === or !==", () => {
    const flags = FEATURE_KEYS.map((key) => FEATURES[key].flag as string);
    const pattern = new RegExp(`\\b(?:env|appEnv)\\.(${flags.join("|")})\\s*[!=]==`);
    const offenders: string[] = [];
    for (const file of walk(path.join(root, "src")).map(rel)) {
      if (file.startsWith("src/config/")) continue;
      for (const line of readFileSync(path.join(root, file), "utf8").split(/\r?\n/)) {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
        if (pattern.test(line)) offenders.push(file + ": " + line.trim().slice(0, 100));
      }
    }
    expect(offenders, 'use featureReady("key") from @/config/features').toEqual([]);
  }, 60_000);
});
