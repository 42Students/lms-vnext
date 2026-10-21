import fs from "fs";
import path from "path";

const ROOTS = ["src/styles", "src/components", "src/pages", "src/layouts"];
const FORBIDDEN = [/#1677ff/ig, /#1890ff/ig];

function filesUnder(relative) {
  const root = path.join(process.cwd(), relative);
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "graphify-out" || entry.name === "node_modules") continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(?:js|jsx|scss|css)$/.test(entry.name)) found.push(full);
    }
  };
  walk(root);
  return found;
}

describe("brand color regression guard", () => {
  test("legacy Ant blues do not re-enter user-facing LMS source", () => {
    const offenders = [];
    ROOTS.flatMap(filesUnder).forEach((file) => {
      const content = fs.readFileSync(file, "utf8");
      FORBIDDEN.forEach((pattern) => {
        pattern.lastIndex = 0;
        if (pattern.test(content)) offenders.push(path.relative(process.cwd(), file));
      });
    });
    expect([...new Set(offenders)]).toEqual([]);
  });
});
