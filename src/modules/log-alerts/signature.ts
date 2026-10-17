import { createHash } from "node:crypto";
import { redactAlertText, safeAlertPath } from "./redaction";

export function alertEnvironment(): "PRODUCTION" | "UAT" | "DEVELOPMENT" {
  if (process.env.APP_ENV === "production") return "PRODUCTION";
  if (process.env.APP_ENV === "uat") return "UAT";
  return "DEVELOPMENT";
}

/** Group equivalent faults without collecting volatile IDs, arguments or stack traces. */
export function normaliseErrorForSignature(message: unknown): string {
  const firstLine = typeof message === "string" ? message.split(/\r?\n/)[0] : "";
  // Normalize volatile structures BEFORE redaction: the phone scrubber also
  // matches hyphenated dates, which can otherwise split equivalent timestamps.
  const canonical = firstLine
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, "[id]")
    .replace(/\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?Z?)?/gi, "[time]")
    .replace(/\b0x[0-9a-f]+\b/gi, "[hex]")
    .replace(/\b\d+(?:\.\d+)?\b/g, "[number]");
  return redactAlertText(canonical).replace(/\s+/g, " ").toLowerCase();
}

export function errorSignatureHash(input: {
  environment: string;
  message: unknown;
  path?: string;
}): string {
  const canonical = input.environment.toUpperCase() + "|" +
    safeAlertPath(input.path ?? "/") + "|" +
    normaliseErrorForSignature(input.message);
  return createHash("sha256").update(canonical).digest("hex");
}
