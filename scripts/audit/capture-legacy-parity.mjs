#!/usr/bin/env node
/**
 * Capture a deterministic, read-only visual snapshot of an authenticated
 * vNext route and optionally compare it with a frozen old-LMS PNG.
 *
 * node scripts/audit/capture-legacy-parity.mjs \
 *   --url http://localhost:3000/mentor/calendar \
 *   --state tests/.auth/mentor.json --out /tmp/mentor-001 \
 *   --reference /path/to/parity-baseline/old/mentor/example.png
 *
 * No form submits or mutating UI actions occur here. For interactive states
 * use separate verified Playwright fixtures, never synthetic "success" toasts.
 */
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { decodePng, compareImages, encodePng } from "./legacy-pixel-compare.mjs";

const flagNames = new Set([
  "--url", "--state", "--out", "--reference", "--masks",
  "--threshold", "--tolerance", "--scroll-y", "--full-page",
  "--allow-readonly-remote",
]);
export function parseOptions(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index++) {
    const name = argv[index];
    if (!flagNames.has(name)) throw Error("Unknown option " + name);
    if (name === "--full-page" || name === "--allow-readonly-remote") {
      result[name.slice(2)] = true;
    } else {
      const value = argv[++index];
      if (!value || value.startsWith("--")) throw Error("Missing value for " + name);
      result[name.slice(2)] = value;
    }
  }
  for (const name of ["url", "out"]) if (!result[name]) throw Error("Missing --" + name);
  const url = new URL(result.url);
  if (!["http:", "https:"].includes(url.protocol) ||
      url.username || url.password || url.hash) {
    throw Error("Use an ordinary http(s) URL without embedded secrets or fragments");
  }
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (!local && !(result["allow-readonly-remote"] && url.protocol === "https:")) {
    throw Error("Remote capture requires --allow-readonly-remote and HTTPS");
  }
  if (url.search) throw Error("Query strings may contain secrets; use a query-free fixture URL");
  if (result["scroll-y"] != null &&
      (!Number.isInteger(Number(result["scroll-y"])) || Number(result["scroll-y"]) < 0)) {
    throw Error("--scroll-y must be a nonnegative integer");
  }
  return result;
}
function digest(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}
function writeJson(path, object) {
  writeFileSync(path, JSON.stringify(object, null, 2) + "\n");
}
function safeUrl(url) {
  const value = new URL(url);
  return value.origin + value.pathname;
}

export async function capture(opts) {
  const dir = resolve(opts.out);
  mkdirSync(dir, { recursive: true });
  const target = new URL(opts.url);
  const browser = await chromium.launch({ headless: true });
  let context;
  try {
    context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      colorScheme: "light",
      reducedMotion: "reduce",
      locale: "en-IN",
      timezoneId: "Asia/Kolkata",
      ...(opts.state ? { storageState: resolve(opts.state) } : {}),
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const requestFailures = [];
    page.on("pageerror", error => {
      consoleErrors.push(String(error.message).slice(0, 400));
    });
    page.on("requestfailed", req => {
      const failed = req.failure()?.errorText || "unknown network failure";
      requestFailures.push({ method: req.method(), url: safeUrl(req.url()),
        failure: failed.slice(0, 180) });
    });
    const response = await page.goto(target.toString(), {
      waitUntil: "domcontentloaded", timeout: 60_000,
    });
    await page.evaluate(async () => { await document.fonts.ready; });
    await page.waitForFunction(() => [...document.images].every(image => image.complete),
      { timeout: 15_000 }).catch(() => {});
    // Wait only for a deterministic layout frame; network-idle can hang on
    // notifications, polling, websockets and observability connections.
    await page.evaluate(() => new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.addStyleTag({ content:
      "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important;}" });
    await page.evaluate(() => window.scrollTo(0, 0));
    if (opts["scroll-y"]) {
      await page.evaluate(y => window.scrollTo(0, y), Number(opts["scroll-y"]));
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
    }
    const actual = page.url();
    const status = response?.status() ?? null;
    const content = await page.locator("body").innerText().catch(() => "");
    const badStatus = status === null || status >= 400 || /\/(?:login|forbidden)(?:\/|$)/.test(new URL(actual).pathname);
    const captureBuffer = await page.screenshot({
      fullPage: opts["full-page"] === true,
      animations: "disabled",
      caret: "hide",
      timeout: 45_000,
    });
    const candidateFile = join(dir, "candidate.png");
    writeFileSync(candidateFile, captureBuffer);
    const png = decodePng(captureBuffer);
    const manifest = {
      capture: "candidate",
      url: safeUrl(actual),
      requestUrl: safeUrl(target.toString()),
      httpStatus: status,
      blockedByAuthOrHttp: badStatus,
      viewport: { width: 1280, height: 800 },
      screenshot: { width: png.width, height: png.height,
        fullPage: opts["full-page"] === true, sha256: digest(captureBuffer) },
      environment: {
        browserVersion: browser.version(),
        deviceScaleFactor: 1, locale: "en-IN",
        timezone: "Asia/Kolkata", colorScheme: "light",
        reducedMotion: "reduce",
      },
      statePathProvided: Boolean(opts.state),
      pageErrors: consoleErrors,
      failedRequests: requestFailures,
      apparentErrorText: /(?:failed to load|something went wrong|internal server error)/i.test(content.slice(0, 2000)),
      warning: "Authenticated data may differ from frozen legacy images. Do not mark visually closed based on a numeric score alone.",
    };
    if (opts.reference) {
      const refBuffer = readFileSync(resolve(opts.reference));
      const masks = opts.masks ?
        JSON.parse(readFileSync(resolve(opts.masks), "utf8")) : [];
      if (!Array.isArray(masks)) throw Error("Masks must be an array");
      const compared = compareImages(decodePng(refBuffer), png, {
        masks,
        threshold: opts.threshold == null ? undefined : Number(opts.threshold),
        tolerance: opts.tolerance == null ? undefined : Number(opts.tolerance),
      });
      writeFileSync(join(dir, "diff.png"), encodePng(compared.diff));
      writeFileSync(join(dir, "overlay.png"), encodePng(compared.overlay));
      manifest.reference = { sha256: digest(refBuffer), file: resolve(opts.reference) };
      manifest.comparison = { ...compared.results,
        pass: compared.results.pass && !badStatus && !manifest.apparentErrorText };
      writeJson(join(dir, "comparison.json"), manifest.comparison);
    }
    writeJson(join(dir, "capture.json"), manifest);
    const acceptable = !badStatus && !manifest.apparentErrorText &&
      (!opts.reference || manifest.comparison.pass);
    return { pass: acceptable, manifest };
  } finally {
    await context?.close();
    await browser.close();
  }
}
async function main() {
  try {
    const options = parseOptions(process.argv.slice(2));
    const result = await capture(options);
    process.stdout.write(JSON.stringify(result.manifest, null, 2) + "\n");
    process.exitCode = result.pass ? 0 : 1;
  } catch (error) {
    process.stderr.write(String(error?.stack ?? error) + "\n");
    process.exitCode = 2;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
