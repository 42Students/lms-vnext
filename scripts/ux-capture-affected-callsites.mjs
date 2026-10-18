#!/usr/bin/env node
/** Audit 2 E-04: browser proof for >=30 *affected* component instances.
 * Requires a reviewed, disposable test-tenant JSON manifest; does not fake fixtures.
 */
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
const baseURL=process.env.UX_BASE_URL;
const manifestPath=process.env.UX_AFFECTED_CALLSITES_MANIFEST;
if (!baseURL || !/^https?:\/\/(localhost|127\.0\.0\.1|dev[.-])/i.test(baseURL) || !manifestPath) {
  process.stderr.write("Provide dev UX_BASE_URL and UX_AFFECTED_CALLSITES_MANIFEST; production is forbidden.\n");
  process.exit(2);
}
const cases=JSON.parse(await readFile(manifestPath,"utf8"));
if(!Array.isArray(cases) || cases.length<30 ||
  new Set(cases.map(item=>item.file+":"+item.line)).size<30 ||
  cases.some(item=>typeof item.file!=="string" || !item.file.startsWith("src/") ||
    !Number.isInteger(item.line) || !item.component || !item.selector ||
    !item.route?.startsWith("/") || !item.storage)) {
  process.stderr.write("Manifest must contain >=30 unique actual source-linked affected call sites, with selector, leaf route and dev role storage.\n");
  process.exit(2);
}
const output="tests/ux-baselines/affected-callsites";
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
const captures=[];
try {
  for(let index=0;index<cases.length;index++){
    const item=cases[index];
    const destination=new URL(item.route,baseURL);
    if(destination.origin!==new URL(baseURL).origin) throw new Error("External fixture URL rejected");
    for(const width of [320,390,1280]){
      const context=await browser.newContext({viewport:{width,height:812},storageState:item.storage});
      try{
        const page=await context.newPage();
        await page.goto(destination.href,{waitUntil:"networkidle",timeout:30_000});
        if(new URL(page.url()).pathname!==destination.pathname) throw new Error("Unexpected auth redirect");
        const node=page.locator(item.selector).first();
        await node.waitFor({state:"visible",timeout:15_000});
        const rect=await node.boundingBox();
        if(!rect || rect.width<1 || rect.height<1) throw new Error("Missing visible component bounds");
        const pageOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
        if(pageOverflow) throw new Error("Unexpected document horizontal scroll: "+item.file);
        const target=join(output,index+"-"+width+".png");
        await node.screenshot({path:target,animations:"disabled"});
        captures.push({
          file:item.file,line:item.line,component:item.component,route:item.route,
          width,sha256:createHash("sha256").update(await readFile(target)).digest("hex"),
        });
      } finally {await context.close();}
    }
  }
} finally {await browser.close();}
await writeFile(join(output,"manifest.json"),JSON.stringify({
  acceptance:"PENDING INDEPENDENT REVIEW",source:"dev",capturedAt:new Date().toISOString(),captures,
},null,2)+"\n");
process.stdout.write("Captured "+captures.length+" affected-callsite frames. Visual/keyboard approval is not automatic.\n");
