import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ENV_GROUP, ENV_KIND, ENV_NAMES } from "@/config/env-names";
import { env, envKind, envOn, rawEnv, readEnv, setEnvNames } from "@/config/env";

/**
 * Configuration has one entry point. These tests pin its behaviour and keep it the only one: no file outside src/config may read a
 * registered variable straight from process.env, so a rename, a default or a validation added in one place reaches everything.
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

describe("the environment reader", () => {
  const touched: string[] = [];
  const set = (name: string, value: string | undefined) => {
    touched.push(name);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  };
  afterEach(() => {
    for (const name of touched.splice(0)) delete process.env[name];
  });

  it("reads the live process environment on every access", () => {
    set("DB09_TPO_API_READY", undefined);
    expect(env.DB09_TPO_API_READY).toBeUndefined();
    set("DB09_TPO_API_READY", "on");
    expect(env.DB09_TPO_API_READY).toBe("on");
    set("DB09_TPO_API_READY", "off");
    expect(env.DB09_TPO_API_READY).toBe("off");
    expect(readEnv("DB09_TPO_API_READY")).toBe("off");
  });

  it("treats a flag as on only when it is exactly 'on'", () => {
    for (const value of ["ON", "true", "1", "yes", " on", "on ", ""]) {
      set("DB09_TPO_API_READY", value);
      expect(envOn("DB09_TPO_API_READY"), JSON.stringify(value)).toBe(false);
    }
    set("DB09_TPO_API_READY", "on");
    expect(envOn("DB09_TPO_API_READY")).toBe(true);
  });

  it("is read-only and exposes only registered names", () => {
    expect(Object.isFrozen(env)).toBe(true);
    expect(Object.keys(env).sort()).toEqual([...ENV_NAMES].sort());
    expect(() => {
      (env as unknown as Record<string, string>)["AUTH_SECRET"] = "x";
    }).toThrow();
  });

  it("hands out the raw environment only through rawEnv()", () => {
    expect(rawEnv()).toBe(process.env);
  });

  it("lists which variables are set, never their values", () => {
    set("TELEGRAM_ALERT_BOT_TOKEN", "super-secret-token-value");
    const names = setEnvNames();
    expect(names).toContain("TELEGRAM_ALERT_BOT_TOKEN");
    expect(JSON.stringify(names)).not.toContain("super-secret-token-value");
  });
});

describe("the registry", () => {
  it("classifies credentials as secrets and readiness switches as flags", () => {
    for (const name of ["AUTH_SECRET", "DATABASE_URL", "R2_SECRET_KEY", "DB_PASSWORD", "TELEGRAM_ALERT_BOT_TOKEN"] as const) {
      expect(envKind(name), name).toBe("secret");
    }
    for (const name of ["DB09_TPO_API_READY", "SECURITY_SHARED_STORE"] as const) {
      if ((ENV_NAMES as readonly string[]).includes(name)) expect(ENV_KIND[name as keyof typeof ENV_KIND], name).toBe(name === "SECURITY_SHARED_STORE" ? "setting" : "flag");
    }
  });

  it("every name has a group, and names are unique and upper-snake", () => {
    expect(new Set(ENV_NAMES).size).toBe(ENV_NAMES.length);
    for (const name of ENV_NAMES) {
      expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
      expect(ENV_GROUP[name], name).toBeTruthy();
    }
  });

  it("leaves the build-time names out: the bundler needs those as literal reads", () => {
    for (const name of ENV_NAMES) {
      expect(name === "NODE_ENV" || name.startsWith("NEXT_"), name).toBe(false);
    }
  });
});

describe("nothing bypasses the central reader", () => {
  const all = walk(path.join(root, "src"))
    .map(rel)
    .filter((file) => !file.startsWith("src/config/"));

  const PROP = /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*["']([A-Z][A-Z0-9_]*)["']\s*\])/g;
  const BUNDLER_LITERAL = (name: string) => name === "NODE_ENV" || name.startsWith("NEXT_");

  it("no registered variable is read straight from process.env outside src/config", () => {
    const offenders: string[] = [];
    for (const file of all) {
      if (file === "src/proxy.ts") continue; // edge runtime: reads its own literals
      const text = readFileSync(path.join(root, file), "utf8");
      if (/^\s*["']use client["']/.test(text)) continue;
      for (const line of text.split(/\r?\n/)) {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
        for (const match of line.matchAll(PROP)) {
          const name = (match[1] || match[2])!;
          if (!BUNDLER_LITERAL(name)) offenders.push(`${file}: ${name}`);
        }
      }
    }
    expect(offenders, "read it through `env` from @/config/env (add the name to the registry first)").toEqual([]);
  }, 60_000);

  it("no file passes the bare process.env object around except through rawEnv()", () => {
    const offenders: string[] = [];
    for (const file of all) {
      if (file === "src/proxy.ts") continue;
      const text = readFileSync(path.join(root, file), "utf8");
      if (/^\s*["']use client["']/.test(text)) continue;
      for (const line of text.split(/\r?\n/)) {
        if (/^\s*(\/\/|\*|\/\*)/.test(line) || /typeof\s+process\.env/.test(line)) continue;
        if (/(?<![.\w$])process\.env(?![.\w$\[])/.test(line)) offenders.push(file);
      }
    }
    expect([...new Set(offenders)]).toEqual([]);
  }, 60_000);

  it("the registry covers every name the source reads (regenerate with scripts/gen-env-registry.cjs)", () => {
    const registered = new Set<string>(ENV_NAMES);
    const missing = new Set<string>();
    for (const file of all) {
      const text = readFileSync(path.join(root, file), "utf8");
      for (const match of text.matchAll(PROP)) {
        const name = (match[1] || match[2])!;
        if (!BUNDLER_LITERAL(name) && !registered.has(name)) missing.add(name);
      }
    }
    expect([...missing]).toEqual([]);
  }, 60_000);
});
