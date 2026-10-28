import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Mentor topbar command search readiness",()=>{
 it("attaches the keyboard shortcut before advertising readiness",()=>{
  const code=readFileSync("src/components/shell/topbar/command-search.tsx","utf8");
  expect(code.indexOf('setShortcutReady(true);'))
    .toBeGreaterThan(code.indexOf('document.addEventListener("keydown", shortcut)'));
  expect(code).toContain('data-shortcut-ready={shortcutReady?"true":"false"}');
  expect(code).toContain('const frame=window.requestAnimationFrame(()=>input.current?.focus())');
  expect(code).toContain('event.key.toLowerCase() === "k"');
 });
 it("the browser still tests Ctrl+K, Escape, ArrowDown and Enter on a real Mentor project",()=>{
  const code=readFileSync("tests/e2e/mentor-portfolio-state-acceptance.spec.ts","utf8");
  const block=code.slice(code.indexOf('test("Ctrl+K Mentor popup'),code.indexOf('test("unified search keyboard'));
  expect(block).toContain('toHaveAttribute("data-shortcut-ready","true")');
  expect(block).toContain('page.keyboard.press("Control+k")');
  expect(block).toContain('input.press("Escape")');
  expect(block).toContain('input.press("ArrowDown")');
  expect(block).toContain('project.press("Enter")');
 });
});
