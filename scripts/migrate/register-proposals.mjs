// Builds one numbered drizzle migration from docs/proposed-migrations/*.sql.
// Splits each file into statements (respecting quotes, comments and $$ blocks),
// joins with drizzle's statement-breakpoint marker, and writes drizzle/<tag>.sql.
// Usage: node scripts/migrate/register-proposals.mjs <tag> [file ...]
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const tag = process.argv[2];
if (!tag) throw new Error("usage: register-proposals.mjs <tag> [files]");
const dir = "docs/proposed-migrations";
let files = process.argv.slice(3);
if (!files.length) {
  files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => path.join(dir, f));
}
const added = (file) => {
  try {
    return Number(
      execSync(`git log --diff-filter=A --format=%ct -- "${file}"`, { encoding: "utf8" }).trim().split("\n").pop() || 0,
    );
  } catch {
    return 0;
  }
};
files.sort((a, b) => added(a) - added(b) || a.localeCompare(b));

function splitStatements(sql) {
  const out = [];
  let cur = "";
  let i = 0;
  let dollar = null;
  while (i < sql.length) {
    const ch = sql[i];
    const rest = sql.slice(i);
    if (dollar) {
      if (rest.startsWith(dollar)) {
        cur += dollar;
        i += dollar.length;
        dollar = null;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    if (rest.startsWith("--")) {
      const end = sql.indexOf("\n", i);
      const stop = end === -1 ? sql.length : end;
      cur += sql.slice(i, stop);
      i = stop;
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = sql.indexOf("*/", i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      cur += sql.slice(i, stop);
      i = stop;
      continue;
    }
    const m = /^\$[A-Za-z_]*\$/.exec(rest);
    if (m) {
      dollar = m[0];
      cur += dollar;
      i += dollar.length;
      continue;
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch) {
          if (sql[j + 1] === ch) j += 2;
          else break;
        } else j++;
      }
      cur += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    if (ch === ";") {
      if (cur.replace(/--[^\n]*/g, "").trim()) out.push(cur.trim() + ";");
      cur = "";
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.replace(/--[^\n]*/g, "").trim()) out.push(cur.trim() + ";");
  return out;
}

const parts = [];
for (const file of files) {
  const sql = fs.readFileSync(file, "utf8");
  const bare = (s) => s.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n").trim();
  const statements = splitStatements(sql).filter((s) => !/^(BEGIN|COMMIT);?$/i.test(bare(s)));
  parts.push(`-- from ${path.basename(file)}\n` + statements.join("\n--> statement-breakpoint\n"));
}
const body = parts.join("\n--> statement-breakpoint\n") + "\n";
fs.writeFileSync(`drizzle/${tag}.sql`, body);
console.log(`wrote drizzle/${tag}.sql from ${files.length} proposals`);
