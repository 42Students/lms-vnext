/**
 * Prints the rendered geometry of the app shell (sidebar, top bar, search, buttons, avatar, canvas) for one route and role,
 * to compare with docs/design/old-lms-shell-spec.md.
 * usage: npx tsx scripts/audit/shell-geometry.ts <uid> <route>   (env: E2E_AUTH_SECRET from .env.local, CHROME_PATH optional)
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");
const BASE = process.env.BASE_URL || "http://localhost:8080";
const [uid, route = "/tpo"] = process.argv.slice(2);
const envText = fs.readFileSync(path.join(ROOT, ".env.local"), "utf8");
const SECRET = (envText.match(/^E2E_AUTH_SECRET=(.*)$/m)?.[1] || "").replace(/["'\r]/g, "");

async function main() {
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addCookies([
    { name: "lms_e2e_identity", value: uid, url: BASE, httpOnly: true, sameSite: "Lax" },
    { name: "lms_e2e_secret", value: SECRET, url: BASE, httpOnly: true, sameSite: "Lax" },
  ]);
  const j: any = await (await ctx.request.get(BASE + "/api/auth/memberships")).json().catch(() => ({}));
  if (j.memberships?.[0]?.id) await ctx.addCookies([{ name: "lms_membership", value: j.memberships[0].id, url: BASE, httpOnly: true, sameSite: "Lax" }]);
  const page = await ctx.newPage();
  await page.goto(BASE + (route.startsWith("/") ? route : "/" + route), { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  const rows = await page.evaluate(`(() => {
    const out = [];
    const rect = (el) => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return { x: Math.round(r.x*10)/10, y: Math.round(r.y*10)/10, w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10, bg: s.backgroundColor, radius: s.borderTopLeftRadius, pad: s.padding, border: s.borderTopWidth + ' ' + s.borderTopColor, shadow: s.boxShadow }; };
    const add = (name, el) => { if (el) out.push({ name, tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : '').split(/\\s+/).slice(0,2).join('.'), ...rect(el) }); };
    add('body', document.body);
    add('header/banner', document.querySelector('header,[role=banner]'));
    add('nav/sidebar', document.querySelector('nav,aside,[class*=sidebar]'));
    add('main', document.querySelector('main'));
    const search = document.querySelector('input[type=search],input[placeholder*=Find],input[aria-label*=Search i],[class*=search] input');
    add('search input', search); if (search) add('search wrapper', search.closest('[class*=search]') || search.parentElement);
    for (const b of document.querySelectorAll('header button,header a,[role=banner] button,[role=banner] a')) { const t = (b.innerText||b.getAttribute('aria-label')||'').trim().slice(0,16); const r = b.getBoundingClientRect(); if (r.width>0) add('top: ' + t, b); }
    const h1 = document.querySelector('h1'); add('h1', h1);
    if (h1) { let p = h1.parentElement; for (let i=0;i<5&&p;i++){ const s=getComputedStyle(p); if (s.backgroundColor==='rgb(255, 255, 255)'&&parseFloat(s.borderTopLeftRadius)>0){ add('canvas candidate', p); break;} p=p.parentElement; } }
    return out;
  })()`);
  for (const r of rows as any[]) console.log(`${r.name.padEnd(22)} ${r.tag}.${r.cls.slice(0,40).padEnd(40)} x=${r.x} y=${r.y} w=${r.w} h=${r.h} bg=${r.bg} radius=${r.radius} pad=${r.pad} border=${r.border}`);
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
