import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const root=process.cwd();
const source=(path)=>readFileSync(join(root,path),"utf8");

/** Source-only safeguards. Not screenshot parity or a claim of browser verification. */
test("prototype parity remains limited to the three opted-in single-workspace portals",()=>{
  const shell=source("src/components/shell/app-shell.tsx");
  const css=source("src/styles/prototype-portals.css");
  const global=source("src/app/globals.css");
  assert.match(shell,/navigation\[0\]\?\.href === "\/tpo\/home" \? "tpo"/);
  assert.match(shell,/navigation\[0\]\?\.href === "\/hr\/home" \? "recruiter"/);
  assert.match(shell,/navigation\[0\]\?\.href === "\/mentor\/projects" \? "mentor"/);
  assert.match(shell,/data-prototype-portal=\{prototypePortal \?\? undefined\}/);
  assert.match(global,/@import "\.\.\/styles\/prototype-portals\.css"/);
  assert.match(css,/\.lms-shell-frame\[data-prototype-portal\]/);
  assert.match(css,/\.lms-shell-frame\[data-prototype-portal="mentor"\]/);
  assert.doesNotMatch(css,/\.lms-shell-frame\s*\{/);
});

test("prototype shell renders the real recruiter drive action",()=>{
  const shell=source("src/components/shell/app-shell.tsx");
  assert.match(shell,/<Link href="\/hr\/drives\/new" className="lms-prototype-recruiter-action">/);
  assert.match(shell,/\+ Request a drive/);
});

test("mentor uses a dedicated six-column list, learner retains its own cards",()=>{
  const code=source("src/components/projects/project-list.tsx");
  const css=source("src/styles/prototype-portals.css");
  assert.match(code,/if \(basePath === "\/mentor\/projects"\) \{/);
  assert.match(code,/if \(basePath === "\/learn\/projects"\) \{/);
  assert.match(code,/prototype-mentor-team-table/);
  assert.match(code,/Team and project/);
  assert.match(code,/aria-label=\{"Project progress for " \+ item\.title\}/);
  assert.match(css,/grid-template-columns: minmax\(0,2\.1fr\).*minmax\(0,1\.1fr\)/);
});

test("all 56 prototype screens remain tracked but not deceptively verified",()=>{
  const doc=source("docs/prototypes/tpo-recruiter-mentor-parity.md");
  const rows=doc.match(/^\| \d\d \|/gm)??[];
  assert.equal(rows.length,56);
  assert.match(doc,/None of the 56 screens are closed or browser-verified/);
});
