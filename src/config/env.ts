import { ENV_GROUP, ENV_KIND, ENV_NAMES, type EnvKind, type EnvName } from "./env-names";

/**
 * The one place the application reads environment variables.
 *
 * `env.NAME` is the raw string (or undefined) exactly as `process.env.NAME` would give, read live on every access so tests that
 * set a variable keep working. The list of names is closed: an unknown name does not type-check, so adding a variable means
 * adding it to the registry (src/config/env-names.ts), which is also what documents it for operators.
 *
 * Two kinds of read intentionally stay as a literal `process.env.X`: `NODE_ENV` and `NEXT_*`, because the bundler replaces
 * those at build time and only a literal expression is replaced.
 */
export type { EnvKind, EnvName };

type EnvReader = Readonly<Record<EnvName, string | undefined>>;

function buildReader(): EnvReader {
  const reader: Record<string, unknown> = {};
  for (const name of ENV_NAMES) {
    Object.defineProperty(reader, name, { enumerable: true, get: () => process.env[name] });
  }
  return Object.freeze(reader) as EnvReader;
}

export const env: EnvReader = buildReader();

export function readEnv(name: EnvName): string | undefined {
  return process.env[name];
}

/** A flag is on only when it is exactly "on" (the convention every readiness and feature flag already uses). */
export function envOn(name: EnvName): boolean {
  return process.env[name] === "on";
}

/**
 * The raw environment object, for the few functions that take a whole environment as a parameter (so tests can pass a fake).
 * Prefer `env.NAME`; this exists so even those call sites go through this module.
 */
export function rawEnv(): NodeJS.ProcessEnv {
  return process.env;
}

export function envKind(name: EnvName): EnvKind {
  return ENV_KIND[name];
}

export function envGroup(name: EnvName): string {
  return ENV_GROUP[name];
}

/** Names of the variables that are currently set, never their values: safe for logs and the operator view. */
export function setEnvNames(): EnvName[] {
  return ENV_NAMES.filter((name) => process.env[name] !== undefined && process.env[name] !== "");
}

export const KNOWN_ENV_NAMES: readonly EnvName[] = ENV_NAMES;
