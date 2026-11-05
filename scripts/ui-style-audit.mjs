#!/usr/bin/env node
// Runtime consistency audit: opens real pages, reads computed styles of every visible element
// and reports anything outside the design system (sizes, weights, radii, spacing, colors,
// shadows, z-index, motion). Read-only: only GET navigations, nothing is submitted.
//
//   node scripts/ui-style-audit.mjs --base-url http://localhost:3000 \
//        --routes docs/planning/ui-surfaces.md --storage-state auth.json [--limit 50] [--fail]
//
// --storage-state is a Playwright storage state for the role being audited (sign in once, elsewhere).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { auditSamples, summarize, tokenRgbSet } from "./ui-style-audit-core.mjs";

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? "true"];
}));
const baseUrl = args["base-url"] ?? "http://localhost:3000";
const routesFile = args.routes ?? "docs/planning/ui-surfaces.md";
const limit = Number(args.limit ?? 0);
const outDir = args.out ?? "ui-style-audit-report";

const routes = [...readFileSync(routesFile, "utf8").matchAll(/^- (\/[^\s[\]]*)$/gm)].map((m) => m[1]).filter((r) => !r.includes("["));
const selected = limit ? routes.slice(0, limit) : routes;

const css = readFileSync("src/app/globals.css", "utf8");
const motion = [...css.matchAll(/--lms-motion-(?:fast|base|slow):\s*([0-9]+)ms/g)].map((m) => Number(m[1]));
const options = {
  tokenColors: tokenRgbSet(css),
  motionTokens: motion.length ? motion : [150, 250, 350],
  shadowTokens: [],
  zTokens: [...css.matchAll(/--lms-z-[a-z-]+:\s*(\d+)/g)].map((m) => Number(m[1])),
};

const require = createRequire(path.resolve("package.json"));
const { chromium } = require("playwright");

function collect() {
  const out = [];
  const px4 = ["Top", "Right", "Bottom", "Left"];
  const pathOf = (el) => {
    const parts = [];
    for (let n = el; n && n.nodeType === 1 && parts.length < 3; n = n.parentElement) {
      parts.unshift(n.tagName.toLowerCase() + (n.getAttribute("data-slot") ? `[${n.getAttribute("data-slot")}]` : ""));
    }
    return parts.join(">");
  };
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    out.push({
      selector: pathOf(el),
      style: {
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing,
        fontFamily: cs.fontFamily, borderRadius: cs.borderRadius, opacity: cs.opacity, color: cs.color,
        backgroundColor: cs.backgroundColor, boxShadow: cs.boxShadow, zIndex: cs.zIndex,
        borderWidths: px4.map((s) => cs[`border${s}Width`]),
        borderColors: px4.map((s) => (parseFloat(cs[`border${s}Width`]) > 0 ? cs[`border${s}Color`] : "transparent")),
        spacings: [...px4.map((s) => cs[`padding${s}`]), ...px4.map((s) => cs[`margin${s}`]), cs.rowGap, cs.columnGap].filter((v) => v && v !== "normal" && v !== "auto"),
        durations: [...cs.transitionDuration.split(","), ...cs.animationDuration.split(",")].map((s) => s.trim()).filter(Boolean),
      },
    });
  }
  return out;
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  ...(args["storage-state"] ? { storageState: args["storage-state"] } : {}),
});
// Read-only: never let the audit change data.
await context.route("**/*", (route) => (route.request().method() === "GET" || route.request().method() === "HEAD" ? route.continue() : route.abort()));
const page = await context.newPage();

// Computed box-shadow strings for the shadow tokens, resolved by the browser itself.
await page.goto(new URL("/", baseUrl).href, { waitUntil: "domcontentloaded" }).catch(() => {});
options.shadowTokens = await page.evaluate(() => {
  const names = [...document.styleSheets].flatMap((s) => { try { return [...s.cssRules]; } catch { return []; } })
    .flatMap((r) => (r.style ? [...r.style].filter((p) => /^--lms-(shadow|elevation|focus-ring|ring-inset|accent-bar|header-shadow|control-shadow|overlay-shadow|dropdown-shadow|tooltip-shadow|toast-shadow|search-dropdown-shadow)/.test(p)) : []));
  const probe = document.createElement("div");
  document.body.append(probe);
  const out = new Set(["none"]);
  for (const n of new Set(names)) { probe.style.boxShadow = `var(${n})`; out.add(getComputedStyle(probe).boxShadow); }
  probe.remove();
  return [...out];
});

const samples = [];
const failures = [];
for (const route of selected) {
  try {
    const res = await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle", timeout: 30000 });
    if (!res || res.status() >= 400) { failures.push(`${route} -> ${res ? res.status() : "no response"}`); continue; }
    for (const s of await page.evaluate(collect)) samples.push({ route, role: args.role ?? "default", ...s });
  } catch (error) {
    failures.push(`${route} -> ${String(error).slice(0, 80)}`);
  }
}
await browser.close();

const findings = auditSamples(samples, options);
const summary = summarize(findings);
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, "findings.json"), JSON.stringify({ summary, findings, failures, routes: selected.length }, null, 1));
const md = ["# UI style audit", "", `Routes audited: ${selected.length - failures.length} of ${selected.length}`, `Off-system values: ${summary.distinctOffSystemValues}`, "", "| Kind | Value | Elements | Routes | Example |", "|---|---|---|---|---|",
  ...findings.slice(0, 200).map((f) => `| ${f.kind} | ${String(f.value).replace(/\|/g, "/")} | ${f.count} | ${f.routes.length} | ${f.examples[0]} |`)];
writeFileSync(path.join(outDir, "findings.md"), md.join("\n") + "\n");
console.log(JSON.stringify(summary));
if (failures.length) console.log(`${failures.length} routes could not be audited (see findings.json)`);
if (args.fail === "true" && findings.length) process.exit(1);
