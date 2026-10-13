/**
 * Applies a ChatGPT work-item reply to the working tree.
 *
 * Input: a text file holding the reply (markdown). Every file appears as
 *   #### FILE: <repo-relative path>
 *   ```lang
 *   <entire file>
 *   ```
 * and deletions as `#### DELETE: <path>`.
 *
 * Safety: only paths under the allowed roots are written, protected areas are
 * refused (auth, security, storage, deploy, CI, migrations, scripts/verify,
 * dotfiles, lockfiles), traversal is rejected, and a dry run is the default.
 *
 *   node scripts/orchestrator/apply-reply.mjs reply.md           (dry run)
 *   node scripts/orchestrator/apply-reply.mjs reply.md --write
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const NL = String.fromCharCode(10);
const CRLF = String.fromCharCode(13, 10);
const ALLOWED_ROOTS = ["src/", "tests/", "docs/", "public/"];
const DENIED = [
  /^src\/modules\/auth\//,
  /^src\/auth\//,
  /^src\/security\//,
  /^src\/modules\/storage\//,
  /^src\/db\/migrations?\//,
  /^drizzle\//,
  /^deploy\//,
  /^\.github\//,
  /^scripts\//,
  /^Dockerfile/,
  /^package(-lock)?\.json$/,
  /(^|\/)\.env/,
  /^next\.config\./,
];

export function parseReply(text) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const ops = [];
  for (let i = 0; i < lines.length; i += 1) {
    const del = /^#{3,5}\s*DELETE:\s*`?([^`\s]+)`?\s*$/.exec(lines[i]);
    if (del) {
      ops.push({ kind: "delete", path: del[1] });
      continue;
    }
    const edit = /^#{3,5}\s*EDIT:\s*`?([^`\s]+)`?\s*$/.exec(lines[i]);
    if (edit) {
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === "") j += 1;
      const open = /^(`{3,}|~{3,})/.exec(lines[j] ?? "");
      if (!open) {
        ops.push({ kind: "error", path: edit[1], reason: "no code fence after EDIT heading" });
        continue;
      }
      const fence = open[1];
      const body = [];
      let k = j + 1;
      while (k < lines.length && !lines[k].startsWith(fence)) {
        body.push(lines[k]);
        k += 1;
      }
      if (k >= lines.length) {
        ops.push({ kind: "error", path: edit[1], reason: "unterminated EDIT fence (reply cut off?)" });
        break;
      }
      const edits = [];
      let mode = null;
      let search = [];
      let replace = [];
      for (const line of body) {
        if (/^<{5,}\s*SEARCH\s*$/.test(line)) { mode = "search"; search = []; replace = []; continue; }
        if (/^={5,}\s*$/.test(line) && mode === "search") { mode = "replace"; continue; }
        if (/^>{5,}\s*REPLACE\s*$/.test(line) && mode === "replace") {
          edits.push({ search: search.join(NL), replace: replace.join(NL) });
          mode = null;
          continue;
        }
        if (mode === "search") search.push(line);
        else if (mode === "replace") replace.push(line);
      }
      if (mode !== null || edits.length === 0) {
        ops.push({ kind: "error", path: edit[1], reason: "malformed SEARCH/REPLACE block" });
      } else {
        ops.push({ kind: "edit", path: edit[1], edits });
      }
      i = k;
      continue;
    }
    const head = /^#{3,5}\s*FILE:\s*`?([^`\s]+)`?\s*$/.exec(lines[i]);
    if (!head) continue;
    let j = i + 1;
    while (j < lines.length && lines[j].trim() === "") j += 1;
    const open = /^(`{3,}|~{3,})/.exec(lines[j] ?? "");
    if (!open) {
      ops.push({ kind: "error", path: head[1], reason: "no code fence after heading" });
      continue;
    }
    const fence = open[1];
    const body = [];
    let k = j + 1;
    while (k < lines.length && !lines[k].startsWith(fence)) {
      body.push(lines[k]);
      k += 1;
    }
    if (k >= lines.length) {
      ops.push({ kind: "error", path: head[1], reason: "unterminated code fence (reply cut off?)" });
      break;
    }
    ops.push({ kind: "write", path: head[1], content: body.join("\n") + "\n" });
    i = k;
  }
  return ops;
}

export function checkPath(p) {
  const norm = p.replace(/\\/g, "/");
  if (path.isAbsolute(norm) || norm.split("/").includes("..")) return "path traversal";
  if (!ALLOWED_ROOTS.some((r) => norm.startsWith(r))) return "outside allowed roots";
  if (DENIED.some((re) => re.test(norm))) return "protected area";
  return null;
}

function main() {
  const [file, flag] = process.argv.slice(2);
  if (!file) throw new Error("usage: apply-reply.mjs <reply.md> [--write]");
  const write = flag === "--write";
  const ops = parseReply(fs.readFileSync(file, "utf8"));
  let refused = 0;
  const applied = [];
  for (const op of ops) {
    if (op.kind === "error") {
      console.log(`ERROR    ${op.path}: ${op.reason}`);
      refused += 1;
      continue;
    }
    const why = checkPath(op.path);
    if (why) {
      console.log(`REFUSED  ${op.path} (${why})`);
      refused += 1;
      continue;
    }
    const target = path.join(ROOT, op.path);
    if (op.kind === "edit") {
      if (!fs.existsSync(target)) {
        console.log(`ERROR    ${op.path}: file to edit does not exist`);
        refused += 1;
        continue;
      }
      let text = fs.readFileSync(target, "utf8").split(CRLF).join(NL);
      let ok = true;
      op.edits.forEach((e, n) => {
        const first = text.indexOf(e.search);
        if (e.search.trim() === "" || first === -1) {
          console.log(`ERROR    ${op.path}: edit ${n + 1} SEARCH text not found`);
          ok = false;
        } else if (text.indexOf(e.search, first + 1) !== -1) {
          console.log(`ERROR    ${op.path}: edit ${n + 1} SEARCH text is not unique`);
          ok = false;
        } else {
          text = text.slice(0, first) + e.replace + text.slice(first + e.search.length);
        }
      });
      if (!ok) { refused += 1; continue; }
      console.log(`${write ? "EDIT   " : "would edit"}  ${op.path} (${op.edits.length} change(s))`);
      if (write) fs.writeFileSync(target, text);
      applied.push(op.path);
      continue;
    }
    if (op.kind === "delete") {
      console.log(`${write ? "DELETE " : "would delete"}  ${op.path}`);
      if (write && fs.existsSync(target)) fs.rmSync(target);
    } else {
      const existed = fs.existsSync(target);
      console.log(`${write ? "WRITE  " : "would write"}  ${op.path} (${existed ? "update" : "new"}, ${op.content.split("\n").length - 1} lines)`);
      if (write) {
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, op.content);
      }
    }
    applied.push(op.path);
  }
  console.log(`\n${applied.length} file(s) ${write ? "applied" : "ok"}, ${refused} refused`);
  process.exitCode = refused ? 2 : 0;
}

if (import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}` ||
    process.argv[1]?.endsWith("apply-reply.mjs")) {
  main();
}
