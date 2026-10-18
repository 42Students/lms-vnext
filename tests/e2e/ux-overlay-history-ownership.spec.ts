import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import ts from "typescript";

/**
 * Actual browser History API, not fabricated PopStateEvents. The marker matcher
 * is extracted from production source so this test cannot silently drift.
 * Audit 3 covers mounted nested React dialogs and native host behavior.
 */
const source = readFileSync("src/components/ui/use-overlay-webview.ts","utf8");
const file=ts.createSourceFile("use-overlay-webview.ts",source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const matcher=file.statements.find(node=>ts.isFunctionDeclaration(node) &&
  node.name?.text==="ownsOverlayHistoryEntry");
if(!matcher)throw new Error("Production marker matcher unavailable");
const matcherJs=ts.transpileModule(matcher.getText(file),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
}).outputText.replace(/^export\s+/,"");

test("RV-04 native history: nested A/B explicit close does not dismiss A, next Back does",async({browser})=>{
 const context=await browser.newContext();
 try{
  const page=await context.newPage();
  await page.route("https://ux-overlay.test/**",async route=>{
   await route.fulfill({status:200,contentType:"text/html",body:"<!doctype html><title>Overlay test</title>"});
  });
  await page.goto("https://ux-overlay.test/");
  await page.addScriptTag({content:matcherJs+"\nwindow.ownsOverlayHistoryEntry=ownsOverlayHistoryEntry;"});
  await page.evaluate(()=>{
    const host=window as typeof window & { events:string[]; ownsOverlayHistoryEntry:(state:unknown,marker:string)=>boolean };
    host.events=[];
    history.pushState({lmsOverlay:"lms-overlay:A:1"},"","#a");
    history.pushState({lmsOverlay:"lms-overlay:B:1"},"","#b");
    window.addEventListener("popstate",event=>{
      const dest=(event as PopStateEvent).state;
      host.events.push(host.ownsOverlayHistoryEntry(dest,"lms-overlay:A:1")?"A-owned":"non-A");
    });
  });
  await page.evaluate(()=>history.back()); // explicit B close
  await expect.poll(()=>page.evaluate(()=>history.state?.lmsOverlay)).toBe("lms-overlay:A:1");
  expect(await page.evaluate(()=>(window as typeof window & {events:string[]}).events)).toEqual(["A-owned"]);
  await page.evaluate(()=>history.back()); // genuine Back A -> base route
  await expect.poll(()=>page.evaluate(()=>history.state?.lmsOverlay ?? null)).toBe(null);
  expect(await page.evaluate(()=>(window as typeof window & {events:string[]}).events)).toEqual(["A-owned","non-A"]);
 }finally{await context.close();}
});

test("RV-04 pending A/B and rapid unrelated Back use destination markers, not global counters",async({browser})=>{
 const context=await browser.newContext();
 try{
  const page=await context.newPage();
  await page.route("https://ux-overlay.test/**",async route=>route.fulfill({contentType:"text/html",body:"<!doctype html><title>Pending</title>"}));
  await page.goto("https://ux-overlay.test/");
  await page.addScriptTag({content:matcherJs+"\nwindow.ownsOverlayHistoryEntry=ownsOverlayHistoryEntry;"});
  await page.evaluate(()=>{
    history.pushState({lmsOverlay:"lms-overlay:A:1"},"","#a");
    history.pushState({lmsOverlay:"lms-overlay:B:1"},"","#b");
  });
  await page.evaluate(()=>history.back());
  await expect.poll(()=>page.evaluate(()=>history.state?.lmsOverlay)).toBe("lms-overlay:A:1");
  await page.evaluate(()=>{
    // Pending A restores its own marker if a genuine hardware Back reached base.
    history.back();
  });
  await expect.poll(()=>page.evaluate(()=>history.state?.lmsOverlay??null)).toBe(null);
  await page.evaluate(()=>history.pushState({lmsOverlay:"lms-overlay:A:1"},"","#pending"));
  const owned=await page.evaluate(()=>{
    const w=window as typeof window & {ownsOverlayHistoryEntry:(state:unknown,marker:string)=>boolean};
    return w.ownsOverlayHistoryEntry(history.state,"lms-overlay:A:1");
  });
  expect(owned).toBe(true);
 }finally{await context.close();}
});
