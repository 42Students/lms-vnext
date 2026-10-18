import test from "node:test";
import assert from "node:assert/strict";
import { scanUxSource } from "../scripts/ux-guard-rules.mjs";

test("RV-06 scans live JSX even outside legacy allowlist and rejects dynamic popup targets", () => {
  const source = `
    export default function Page({ external, unsafe }) {
      return <main>
        <a target={external ? "_blank" : "_self"} href="/">Popup</a>
        <a target={unsafe} href="/">Unknown target</a>
        <a target="_self" href="/">Safe</a>
        <button className={unsafe ? "min-h-10" : "min-h-11"}>Go</button>
        <button className={"min-h-" + (unsafe ? "10" : "11")}>Dynamic 40px</button>
        <button className={"bg-primary text-white"}>Bad contrast</button>
      </main>;
    }`;
  const found=scanUxSource("src/app/legacy/route.tsx",source);
  expectRules(found,{"unsafe-target":2,"small-touch-target":2,"white-on-teal":1});
});
test("RV-06 uses exact source fingerprints so a new identical violation exceeds the baseline count", () => {
  const old=scanUxSource("src/app/test.tsx",'<a target="_blank" href="/old">Old</a>');
  const updated=scanUxSource("src/app/test.tsx",'<><a target="_blank" href="/old">Old</a><a target="_blank" href="/old">Old</a></>');
  assert.equal(old.length,1);
  assert.equal(updated.length,2);
  assert.equal(updated[0].snippet,updated[1].snippet);
});
function expectRules(items, expected){
  for(const [rule,count] of Object.entries(expected))assert.equal(items.filter(item=>item.rule===rule).length,count,rule);
}
