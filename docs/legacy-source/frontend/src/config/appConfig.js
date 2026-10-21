/**
 * Application Configuration
 *
 * Centralized configuration file for API URLs, R2 storage, and other app settings.
 * Update these values here to change them across the entire application.
 */

import { isLocalDevelopmentHost } from "@/utils/tenantUtils";

function resolveApiUrl() {
  const envApiUrl =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
    "http://localhost:8080";

  if (typeof window === "undefined") {
    return envApiUrl;
  }

  const { protocol, hostname, origin } = window.location;
  if (isLocalDevelopmentHost(hostname)) {
    return envApiUrl;
  }

  if (
    protocol === "https:" &&
    (hostname === "42lms.com" ||
      hostname === "www.42lms.com" ||
      hostname.endsWith(".42lms.com"))
  ) {
    return `${origin}/lms-backend`;
  }

  return envApiUrl;
}

export const API_URL = resolveApiUrl();

function normalizeUrl(value) {
  if (!value || typeof value !== "string") return "";
  return value.trim().replace(/\/+$/, "");
}

function hostnameFromUrl(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) return "";
  try {
    return new URL(normalized).hostname;
  } catch {
    return normalized.replace(/^https?:\/\//, "").split("/")[0];
  }
}

const envR2PublicUrl =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_R2_PUBLIC_URL) ||
  "";
const envR2PublicDomain =
  (typeof process !== "undefined" && (process.env?.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || process.env?.NEXT_PUBLIC_R2_DOMAIN)) ||
  "";

export const R2_PUBLIC_URL = normalizeUrl(envR2PublicUrl) || "https://storesuuploads.42lms.in";
export const R2_PUBLIC_DOMAIN = envR2PublicDomain || hostnameFromUrl(R2_PUBLIC_URL);

export const RESUME_URL_ALLOWED_DOMAINS = [
  R2_PUBLIC_DOMAIN,
  "storesuuploads.42lms.in",
  "42lms.in",
  "42lms.com",
  "r2.dev",
].filter(Boolean);

export default {
  API_URL,
  R2_PUBLIC_URL,
  R2_PUBLIC_DOMAIN,
  RESUME_URL_ALLOWED_DOMAINS,
};
