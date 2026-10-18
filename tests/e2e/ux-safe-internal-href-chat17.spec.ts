import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import ts from "typescript";

/**
 * No running LMS, tenant seed, or production credentials required.
 * The production validator is transpiled from its own source and exercised
 * inside Chromium's URL parser, rather than recreating it in this test.
 */
const source=readFileSync("src/lib/safe-internal-href.ts","utf8");
const parsed=ts.createSourceFile("safe-internal-href.ts",source,
  ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
const fn=parsed.statements.find(node=>ts.isFunctionDeclaration(node) &&
  node.name?.text==="isSafeInternalHref");
if(!fn)throw new Error("UX-kit-HARDEN-35 production validator missing");
const compiled=ts.transpileModule(fn.getText(parsed).replace(/^export\s+/,""),{
  compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None},
}).outputText.replace(/^export\s+/,"");

test("UX-kit-HARDEN-35 browser blocks encoded protocol-relative paths and preserves valid intra-app navigation",async({page})=>{
  await page.route("https://ui-kit-nav.example.test/**",async route=>
    route.fulfill({contentType:"text/html",body:"<!doctype html><title>Navigation checks</title><div id='status'></div>"}));
  await page.goto("https://ui-kit-nav.example.test/");
  await page.addScriptTag({content:compiled+"\nwindow.isSafeInternalHref=isSafeInternalHref;"});
  const results=await page.evaluate(()=>{
    const validate=(window as typeof window & {isSafeInternalHref:(href:string)=>boolean}).isSafeInternalHref;
    const bad=[
      "//evil.example.test","/\\evil.example.test","/%2fevil.example.test",
      "/%5cevil.example.test","/%252fevil.example.test","/%25255cevil.example.test",
      "https://evil.example.test","javascript:alert(1)"," /college/projects",
    ];
    const good=[
      "/college/projects","/mentor/projects?view=table",
      "/learn/projects#history","/college/projects?q=%252f",
    ];
    return {
      bad:bad.map(href=>({href,allowed:validate(href)})),
      good:good.map(href=>({href,allowed:validate(href),
        origin:new URL(href,location.href).origin})),
      origin:location.origin,
    };
  });
  for(const item of results.bad)expect(item.allowed,item.href).toBe(false);
  for(const item of results.good){
    expect(item.allowed,item.href).toBe(true);
    expect(item.origin).toBe(results.origin);
  }
});
