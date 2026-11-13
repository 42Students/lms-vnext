import { NextResponse } from "next/server";

/**
 * The one place a response's caching is decided. A route says what KIND of response it returns (private data, public data,
 * a download); the cache header comes from here, so a change to caching policy is one edit and no route can forget it.
 */
export const CACHE = Object.freeze({
  /** Anything that depends on who is asking: never stored by browsers or shared caches. */
  PRIVATE: "private, no-store",
  /** Same, plus an explicit zero lifetime for clients that ignore no-store on redirects or errors. */
  PRIVATE_STRICT: "private, no-store, max-age=0",
  /** Not person-specific but must always be revalidated (health, status). */
  NONE: "no-store",
  /** Public, non-personal data that may be shared briefly. */
  PUBLIC_SHORT: "public, max-age=60",
} as const);

export type CachePolicy = (typeof CACHE)[keyof typeof CACHE];

function withCache(init: ResponseInit | undefined, policy: CachePolicy): ResponseInit {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", policy);
  return { ...init, headers };
}

/** JSON that depends on the signed-in person. */
export function privateJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, withCache(init, CACHE.PRIVATE));
}

/** JSON that must never be cached anywhere, with the strict form of the header. */
export function strictPrivateJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, withCache(init, CACHE.PRIVATE_STRICT));
}

/** JSON that is the same for everyone but must always be re-fetched. */
export function noStoreJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, withCache(init, CACHE.NONE));
}

/** JSON that is identical for everyone and safe to share for a short time. */
export function publicJson(body: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json(body, withCache(init, CACHE.PUBLIC_SHORT));
}

/** Apply a cache policy to a response you already built (downloads, redirects, streams). */
export function withCachePolicy<T extends Response>(response: T, policy: CachePolicy): T {
  response.headers.set("Cache-Control", policy);
  return response;
}
