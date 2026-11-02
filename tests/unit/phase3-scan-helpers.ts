import fs from "node:fs";
import path from "node:path";

export const root = process.cwd();
export const rel = (p: string) => path.relative(root, p).replaceAll("\\", "/");
export const read = (p: string) => fs.readFileSync(p, "utf8");

export function walk(dir: string, out: string[] = []): string[] {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const name of fs.readdirSync(abs)) {
    const p = path.join(abs, name);
    if (fs.statSync(p).isDirectory()) walk(rel(p), out);
    else out.push(p);
  }
  return out;
}

export const routeFiles = (dir: string) => walk(dir).filter((p) => /[\\/]route\.ts$/.test(p));
export const pageFiles = (dir: string) => walk(dir).filter((p) => /[\\/]page\.tsx$/.test(p));

const HELPERS =
  "resolveActingCollege|assertPersistedPlatformPermission|require[A-Z][A-Za-z]*(?:Admin|Scope|Access|Actor|Permission)[A-Za-z]*\\(";
export const GUARD = new RegExp(
  `isSuperAdmin\\(|requireSuperAdmin|SUPER_ADMIN|requirePermission\\(|\\bcan\\(|${HELPERS}`,
);

function resolveImport(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(root, "src", spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null;
  for (const c of [
    base + ".ts",
    base + ".tsx",
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

/** Source of the file plus every directly imported `@/` or relative module (one hop). */
export function oneHopSources(file: string): string[] {
  const src = read(file);
  const out = [src];
  for (const m of src.matchAll(/from\s+["']((?:@\/|\.\.?\/)[^"']+)["']/g)) {
    const f = resolveImport(m[1]!, file);
    if (f) out.push(read(f));
  }
  return out;
}

export const hasGuardWithinOneHop = (file: string) => oneHopSources(file).some((s) => GUARD.test(s));
export const hasRequestContext = (src: string) => /getCurrentRequestContext/.test(src);

export function exportedMethods(src: string): string[] {
  return [
    ...src.matchAll(/export\s+(?:async\s+function|const|function)\s+(GET|POST|PUT|PATCH|DELETE)\b/g),
  ].map((m) => m[1]!);
}

function matchClose(src: string, openIdx: number, open: string, close: string): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = openIdx; i < src.length; i++) {
    const c = src[i]!;
    if (quote) {
      if (c === "\\") i++;
      else if (c === quote) quote = null;
      continue;
    }
    if (c === "/" && src[i + 1] === "/") {
      const nl = src.indexOf("\n", i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      quote = c;
      continue;
    }
    if (c === open) depth++;
    else if (c === close && --depth === 0) return i;
  }
  return -1;
}

/**
 * Body of one exported HTTP handler (brace-matched). A re-export such as
 * `export const GET = getX;` returns its statement text.
 */
export function handlerBody(src: string, method: string): string | null {
  const re = new RegExp(`export\\s+(?:async\\s+function|const|function)\\s+${method}\\b`);
  const m = re.exec(src);
  if (!m) return null;
  const from = m.index + m[0].length;
  const paren = src.indexOf("(", from);
  const semi = src.indexOf(";", from);
  const arrowOrAssign = src.slice(from, paren === -1 ? from : paren);
  if (/^\s*=\s*[A-Za-z_$][\w$.]*\s*$/.test(arrowOrAssign) || paren === -1) {
    return src.slice(from, semi === -1 ? src.length : semi);
  }
  const parenEnd = matchClose(src, paren, "(", ")");
  if (parenEnd === -1) return src.slice(from);
  const brace = src.indexOf("{", parenEnd);
  if (brace === -1) return src.slice(from);
  const end = matchClose(src, brace, "{", "}");
  return src.slice(brace, end === -1 ? src.length : end + 1);
}
