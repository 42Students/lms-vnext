/**
 * Probes the local OTP login for one test phone (never prints codes). Uses the dev-only test OTP from .env.local.
 * usage: npx tsx scripts/audit/login-probe.ts <phoneDigitsWithCountryCode>   e.g. 919100061000
 */
import fs from "node:fs";
import path from "node:path";
import { request } from "@playwright/test";

const ROOT = path.resolve(__dirname, "../..");
const BASE = process.env.BASE_URL || "http://localhost:8080";
const env: Record<string, string> = {};
for (const l of fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split(/\r?\n/)) { const i = l.indexOf("="); if (i > 0 && !l.startsWith("#")) env[l.slice(0, i)] = l.slice(i + 1).replace(/^["']|["']$/g, ""); }
const OTP = env.AUTH_TEST_OTP;
async function main() {
  const phone = process.argv[2];
  const ctx = await request.newContext({ baseURL: BASE, extraHTTPHeaders: { Origin: BASE } });
  const start = await ctx.post("/api/auth/login/start", { data: { channel: "PHONE", contact: "+" + phone } });
  const sj: any = await start.json().catch(() => ({}));
  console.log("start", start.status(), Object.keys(sj).join(","), "requiresSecondFactor=", sj.requiresSecondFactor, "error=", sj.error || "");
  if (!sj.attemptId) return;
  const verify = await ctx.post("/api/auth/login/verify", { data: { attemptId: sj.attemptId, code: OTP, ...(sj.requiresSecondFactor ? { secondCode: OTP } : {}) } });
  const vj: any = await verify.json().catch(() => ({}));
  console.log("verify", verify.status(), Object.keys(vj).join(","), "error=", vj.error || "");
  const cookies = (await ctx.storageState()).cookies.map((c) => c.name);
  console.log("cookies:", cookies.join(","));
  const mem = await ctx.get("/api/auth/memberships"); console.log("memberships", mem.status());
  await ctx.dispose();
}
main().catch((e) => { console.error(String(e.message || e).slice(0, 300)); process.exit(1); });
