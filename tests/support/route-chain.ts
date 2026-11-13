import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

/**
 * Static helpers for the route contract tests: list every API route file and follow the modules a route calls
 * (alias `@/` and relative imports, a few levels deep) to see whether a check exists anywhere in that chain.
 * Heuristic by design: it proves "a check is reachable", and the tests keep a short, reviewed exception list.
 */
const root = process.cwd();

export function listRouteFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name === "route.ts") out.push(full);
    }
  };
  walk(path.join(root, "src/app/api"));
  return out.sort();
}

export const rel = (file: string) => path.relative(root, file).split(path.sep).join("/");
export const read = (file: string) => readFileSync(file, "utf8");

function resolveImport(from: string, spec: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const candidate of [base + ".ts", base + ".tsx", path.join(base, "index.ts")]) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const IMPORT = /from\s+["']((?:@\/|\.)[^"']+)["']/g;
const cache = new Map<string, boolean>();

/** True when `pattern` matches the file or any module it imports, up to `depth` levels. */
export function reaches(file: string, pattern: RegExp, depth = 2, stripImports = false): boolean {
  const key = `${file}|${pattern.source}|${depth}`;
  if (cache.has(key)) return cache.get(key)!;
  cache.set(key, false);
  const source = read(file);
  const body = stripImports ? source.replace(/^import[\s\S]*?from\s+["'][^"']+["'];?\s*$/gm, "") : source;
  let ok = pattern.test(body);
  if (!ok && depth > 0) {
    for (const match of source.matchAll(IMPORT)) {
      const next = resolveImport(file, match[1]!);
      if (!next) continue;
      const relative = rel(next);
      // Only service modules count. The wrapper (security/), shared helpers (lib/) and auth plumbing mention these
      // words themselves and would make every route pass.
      if (!/^src\/modules\//.test(relative)) continue;
      if (reaches(next, pattern, depth - 1)) { ok = true; break; }
    }
  }
  cache.set(key, ok);
  return ok;
}

/** True when the route file, or anything it imports, matches. The route file's own import lines are ignored. */
export function routeReaches(file: string, pattern: RegExp, depth = 2): boolean {
  if (reaches(file, pattern, 0, true)) return true;
  const source = read(file);
  for (const match of source.matchAll(IMPORT)) {
    const next = resolveImport(file, match[1]!);
    if (!next || !/^src\/modules\//.test(rel(next))) continue;
    if (reaches(next, pattern, depth)) return true;
  }
  return false;
}
