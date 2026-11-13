/**
 * Production defaults to the shared store so rate limits and replay claims hold across replicas without anyone having
 * to remember to switch it on. Set SECURITY_SHARED_STORE=off to opt out explicitly; development and tests default off.
 */
import { rawEnv } from "@/config/env";
export function sharedStoreEnabled(env: Record<string, string | undefined> = rawEnv()): boolean {
  const value = env["SECURITY_SHARED_STORE"];
  if (value === "off") return false;
  if (value === "on") return true;
  return env["NODE_ENV"] === "production";
}
