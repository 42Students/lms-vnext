import { env } from "@/config/env";

/**
 * Every cookie that carries sign-in state is set and cleared here, with one set of attributes: HttpOnly, SameSite=Lax,
 * path "/", and Secure in production (or when COOKIE_SECURE=1 for an https dev proxy). A route names the cookie and its
 * lifetime; it never writes these attributes itself, so no cookie can be shipped without them.
 */
type CookieJarOwner = {
  cookies: { set: (name: string, value: string, options: Record<string, unknown>) => unknown };
};

export function authCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || env.COOKIE_SECURE === "1",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function setAuthCookie(response: CookieJarOwner, name: string, value: string, maxAgeSeconds: number): void {
  response.cookies.set(name, value, authCookieOptions(maxAgeSeconds));
}

export function clearAuthCookie(response: CookieJarOwner, name: string): void {
  response.cookies.set(name, "", authCookieOptions(0));
}

export function clearAuthCookies(response: CookieJarOwner, names: readonly string[]): void {
  for (const name of names) clearAuthCookie(response, name);
}

/** Set the cookie while the value is non-empty; otherwise clear it. For optional state such as a remembered role. */
export function setOrClearAuthCookie(response: CookieJarOwner, name: string, value: string | null | undefined, maxAgeSeconds: number): void {
  if (value) setAuthCookie(response, name, value, maxAgeSeconds);
  else clearAuthCookie(response, name);
}
