import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import { authCookieOptions, clearAuthCookie, clearAuthCookies, setAuthCookie, setOrClearAuthCookie } from "@/auth/cookies";

const read = (response: NextResponse, name: string) => response.cookies.get(name);

describe("auth cookie helper", () => {
  it("sets HttpOnly, SameSite=Lax, path / and the given lifetime", () => {
    const options = authCookieOptions(600);
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
    const response = NextResponse.json({});
    setAuthCookie(response, "lms_session", "token", 600);
    expect(read(response, "lms_session")).toMatchObject({ value: "token", httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  });
  it("clearing sets an empty value that expires at once, for one cookie or a list", () => {
    const response = NextResponse.json({});
    clearAuthCookie(response, "a");
    clearAuthCookies(response, ["b", "c"]);
    for (const name of ["a", "b", "c"]) expect(read(response, name)).toMatchObject({ value: "", maxAge: 0, httpOnly: true });
  });
  it("setOrClear sets a non-empty value and clears an empty one", () => {
    const response = NextResponse.json({});
    setOrClearAuthCookie(response, "role", "TPO", 100);
    setOrClearAuthCookie(response, "gone", "", 100);
    setOrClearAuthCookie(response, "none", null, 100);
    expect(read(response, "role")).toMatchObject({ value: "TPO", maxAge: 100 });
    expect(read(response, "gone")).toMatchObject({ value: "", maxAge: 0 });
    expect(read(response, "none")).toMatchObject({ value: "", maxAge: 0 });
  });
  it("is Secure in production", () => {
    const original = process.env.NODE_ENV;
    (process.env as Record<string, string>)["NODE_ENV"] = "production";
    try {
      expect(authCookieOptions(1).secure).toBe(true);
    } finally {
      (process.env as Record<string, string>)["NODE_ENV"] = original ?? "test";
    }
  });
});
