import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import snapshot from "../../docs/audit/graceful/raw-error-allowlist.json";

const baseline: Record<string, string> = snapshot.files;
function allComponentFiles(root = "src/components"): string[] {
  const output: string[] = [];
  for (const item of readdirSync(root, { withFileTypes: true })) {
    const name = path.posix.join(root, item.name);
    if (item.isDirectory()) output.push(...allComponentFiles(name));
    else if (/\.tsx?$/.test(name)) output.push(name);
  }
  return output;
}
function blobHash(content: string) {
  return createHash("sha1").update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest("hex");
}
const rawErrorPatterns = [
  /\{\s*(?:result|body)\.error\b(?!\s*(?:\.|\?\.))/,
  /\{\s*reason\.message\b/,
  // A local Zod issue tree is field-validation data, not a server error code.
  // Keep direct result.error assignments forbidden, including optional chaining.
  /set(?:Error|Notice)\(\s*(?:result|body)\.error\b(?!\s*\.)/,
  /set(?:Error|Notice)\(\s*reason\.message\b/,
  /set(?:Error|Notice)\(\s*["'][A-Z][A-Z0-9_]{5,}["']/,
  /\{\s*["'][A-Z][A-Z0-9_]{5,}["']\s*\}/,
  /<(?:p|div|span|small|strong|label|h[1-6])[^>]*>\s*(?:[A-Z][A-Z0-9]*_[A-Z0-9_]{3,}|UNAUTHORIZED|FORBIDDEN|NOT_FOUND)\s*</,
];
const mutatingFetch = /fetch\([\s\S]{0,350}?\bmethod:\s*["'](?:POST|PUT|PATCH|DELETE)["']/g;

function hasInteractiveMutation(source: string): boolean {
  // A browser crash report or idempotent public join-link open receipt is
  // best-effort telemetry, not an interactive submission.
  return [...source.matchAll(mutatingFetch)]
    .some((match) => !match[0].includes('"/api/client-errors"') &&
      !match[0].includes('"/api/public/join-link/open"'));
}

/** GR-31: deduplicated mutations may use the shared hook OR an existing
 * request/ref guard. The original test falsely rejected actual pending-state
 * locks simply for not importing a specific React hook. */
function hasMutationGuard(source: string): boolean {
  if (source.includes("useGuardedAction(")) return true;
  // Playback autosave and learner submission have synchronous in-flight
  // guards: these cannot be double-submitted by a second click.
  if (/(?:savingRef|inFlightRef|pendingRef)\s*=\s*useRef\(/.test(source) &&
      /(?:savingRef|inFlightRef|pendingRef)\.current/.test(source)) return true;
  const guardNames=[...source.matchAll(/\b([A-Za-z]\w*Ref)\s*=\s*useRef\(false\)/g)].map(match=>match[1]!);
  // Merely declaring a ref is not protection: a synchronous click lock must
  // check, reserve, and release that same ref around an interactive mutation.
  if(guardNames.some(ref=>source.includes("if ("+ref+".current")||source.includes("if("+ref+".current"))){
    const active=guardNames.some(ref=>source.includes(ref+".current = true")&&
      source.includes(ref+".current = false")&&
      (source.includes("if ("+ref+".current")||source.includes("if("+ref+".current")));
    if(active)return true;
  }
  if (source.includes("createSubmissionFlightGuard()") &&
      source.includes("flight.current.begin()") &&
      source.includes("flight.current.end()")) return true;
  // Existing forms also guard a request with a busy state plus disabled
  // submission controls. This is valid without prescribing one React hook.
  const pendingControl =
    /(?:set[A-Z]\w*\(true\)|setRolePending\(|start\w*Transition\()/.test(source);
  const disabledControl =
    /disabled=\{[^}]*\b(?:pending|busy|saving|savingResults|rolePending|lifecyclePending|submitting|deleting|loading)\b/.test(source);
  return pendingControl && (disabledControl || source.includes("pending={pending}"));
}

describe("new raw-error and mutation regression gate", () => {
  it("GR-09 rejects new renderings of API codes or internal error messages", () => {
    const offenders = allComponentFiles().filter((file) => {
      const content = readFileSync(file, "utf8");
      const leaks = rawErrorPatterns.some((pattern) => pattern.test(content));
      return leaks && blobHash(content) !== baseline[file];
    });
    expect(offenders, `New unsafe error rendering in: ${offenders.join(", ")}`).toEqual([]);
  });
  it("GR-09 protects JSX from API error codes without treating local Zod issue lists as codes", () => {
    const jsxPattern = rawErrorPatterns[0];
    expect(jsxPattern.test("{result.error}")).toBe(true);
    expect(jsxPattern.test("{body.error}")).toBe(true);
    expect(jsxPattern.test("{result.error.issues.map((issue) => issue.message)}")).toBe(false);
    expect(jsxPattern.test("{body.error?.issues[0]?.message}")).toBe(false);
  });
  it("GR-09 rejects raw API codes without falsely treating uppercase page labels as codes", () => {
    const pattern = rawErrorPatterns[6];
    expect(pattern.test("<span>COMPANY</span>")).toBe(false);
    expect(pattern.test("<strong>RECRUITER STATUS</strong>")).toBe(false);
    expect(pattern.test("<span>TPO_CRM_FOLLOWUP_ALREADY_DONE</span>")).toBe(true);
    expect(pattern.test("<p>UNAUTHORIZED</p>")).toBe(true);
  });
  it("GR-09 distinguishes direct raw API errors from client Zod issue details", () => {
    const pattern = rawErrorPatterns[2];
    expect(pattern.test('setNotice(result.error)')).toBe(true);
    expect(pattern.test('setError(body.error)')).toBe(true);
    expect(pattern.test('setNotice(result.error.issues[0]?.message)')).toBe(false);
  });
  it("GR-31 excludes error telemetry but keeps detecting interactive writes", () => {
    expect(hasInteractiveMutation('fetch("/api/client-errors", {method: "POST"})')).toBe(false);
    expect(hasInteractiveMutation('fetch("/api/records", {method: "POST"})')).toBe(true);
    expect(hasInteractiveMutation('fetch("/api/client-errors", {method: "POST"})\\nfetch("/api/records", {method: "PATCH"})')).toBe(true);
  });
  it("GR-31 detects an unguarded interactive write but accepts existing locked autosaves and disabled pending controls", () => {
    expect(hasMutationGuard('function save(){fetch("/api/jobs",{method:"POST"})}')).toBe(false);
    expect(hasMutationGuard('const [pending,setPending]=useState(false); function submit(){setPending(true);fetch("/api/jobs",{method:"POST"})} return <button disabled={pending}>Save</button>')).toBe(true);
    expect(hasMutationGuard('const savingRef=useRef(false);if(savingRef.current)return;savingRef.current=true;fetch("/api/progress",{method:"PUT"})')).toBe(true);
    expect(hasMutationGuard("const {run}=useGuardedAction({})")).toBe(true);
    expect(hasInteractiveMutation('fetch("/api/public/join-link/open",{method:"POST"})')).toBe(false);
  });
  it("GR-31 inventories newly changed unguarded mutating components", () => {
    const offenders = allComponentFiles().filter((file) => {
      const content = readFileSync(file, "utf8");
      return hasInteractiveMutation(content) && !hasMutationGuard(content) &&
        blobHash(content) !== baseline[file];
    });
    expect(offenders, `Mutating fetch without useGuardedAction: ${offenders.join(", ")}`).toEqual([]);
  });
});
