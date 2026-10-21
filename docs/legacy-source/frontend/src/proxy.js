import { NextResponse } from "next/server";
import { isGlobalHost } from "./utils/host";
import {
  homePathForRole,
  resolveRoleFromClaims,
  strictPortalRedirect,
  PROTECTED_APP_PREFIXES,
} from "./config/roles";

// Protected route prefixes — require authentication
// Every role portal (src/config/roles.js) plus the shared signed-in pages. "/ai-grading" is in
// there too: a fully-built AI grading tool whose backend calls OpenAI directly — it had no auth
// prefix here and no page-level check of its own, so it (and its API routes, see the ai-grading
// route handlers) were reachable by anyone who found the URL, unauthenticated.
const PROTECTED_PREFIXES = PROTECTED_APP_PREFIXES;

// Public routes — never redirect (includes the apex marketing site)
const PUBLIC_PREFIXES = [
  "/login",
  "/superadmin-login",
  "/recruiter-invite",
  "/company-join",
  "/college-join",
  "/placements",
  "/campaign-unsubscribe",
  "/company-share",
  "/auth/handoff",
  "/_next",
  "/api",
  "/assets",
  // Marketing site (served on the apex/global host)
  "/home",
  "/platform",
  "/universities",
  "/enterprises",
  "/request-demo",
];

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return {};
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(payload);
    return JSON.parse(json) || {};
  } catch {
    return {};
  }
}

function isJwtExpired(claims) {
  const exp = claims?.exp;
  const expNum = typeof exp === "number" ? exp : Number(exp);
  if (!Number.isFinite(expNum) || expNum <= 0) return false; // can't validate; best-effort allow
  const nowSec = Math.floor(Date.now() / 1000);
  return expNum <= nowSec;
}

function getRoleFromClaims(claims) {
  const userType = typeof claims.userType === "string" ? claims.userType.toUpperCase() : null;
  const facultyType = typeof claims.facultyType === "string" ? claims.facultyType.toUpperCase() : null;
  const sub = claims.sub != null ? String(claims.sub) : null;

  const isSuperAdmin = sub === "0" && userType === "FACULTY";
  const isAdmin = userType === "FACULTY" && facultyType === "ADMIN";
  const isMentor = userType === "FACULTY" && facultyType === "MENTOR";
  const isFaculty = userType === "FACULTY";
  const isLearner = userType === "LEARNER";
  return { userType, facultyType, sub, isSuperAdmin, isAdmin, isMentor, isFaculty, isLearner };
}

function dashboardPathForClaims(claims) {
  return homePathForRole(resolveRoleFromClaims(claims));
}

function hasValidAuthCookie(request) {
  const cookieValue = request.cookies.get("lms_authenticated")?.value;
  const isValidJwtShape =
    cookieValue &&
    cookieValue.split(".").length === 3 &&
    cookieValue.split(".").every((part) => part.length > 0);
  if (!isValidJwtShape) return null;
  const claims = decodeJwtPayload(cookieValue);
  if (isJwtExpired(claims)) return null;
  return claims;
}

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Root path is host-aware:
  // - Apex/global host (42lms.com, www, dev): unauthenticated -> marketing site,
  //   authenticated -> role dashboard.
  // - Tenant host (college subdomains / custom domains): keep the existing skinned login.
  if (pathname === "/") {
    if (isGlobalHost(request.headers.get("host"))) {
      const claims = hasValidAuthCookie(request);
      if (claims) {
        return NextResponse.redirect(
          new URL(dashboardPathForClaims(claims), request.url)
        );
      }
      return NextResponse.rewrite(new URL("/home", request.url));
    }
    return NextResponse.next();
  }

  // BE-0209: the files in src/pages/superadmin/sections are building blocks of the Super Admin pages, not pages. Next
  // still routes them (/superadmin/sections/Faculty ...), where they render without the Super Admin layout and its
  // scope guard. Nobody links there, so they answer "not found".
  if (/^\/superadmin\/sections(\/|$)/i.test(pathname)) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  // Skip public routes and static assets
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // Check for auth cookie (must be set on login alongside localStorage).
  // Validate the cookie looks like a real JWT (3 base64url segments) to prevent
  // trivial bypass by setting lms_authenticated=1 manually.
  const authCookie = request.cookies.get("lms_authenticated");
  const cookieValue = authCookie?.value;
  const isValidJwtShape =
    cookieValue &&
    cookieValue.split(".").length === 3 &&
    cookieValue.split(".").every((part) => part.length > 0);
  if (!isValidJwtShape) {
    const loginUrl = pathname.startsWith("/superadmin")
      ? "/superadmin-login"
      : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }

  // Role-based route guards (best-effort; uses unsigned JWT payload for routing only).
  const claims = decodeJwtPayload(cookieValue);
  if (isJwtExpired(claims)) {
    const loginUrl = pathname.startsWith("/superadmin")
      ? "/superadmin-login"
      : "/login";
    return NextResponse.redirect(new URL(loginUrl, request.url));
  }
  const role = getRoleFromClaims(claims);

  // Unknown account type: treat as signed out instead of guessing a portal.
  const roleKey = resolveRoleFromClaims(claims);
  if (!roleKey) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  // recruiter and TPO live only in their own portals, and nobody else may enter those portals.
  const strictRedirect = strictPortalRedirect(roleKey, pathname);
  if (strictRedirect) {
    return NextResponse.redirect(new URL(strictRedirect, request.url));
  }

  if (pathname.startsWith("/superadmin") && !role.isSuperAdmin) {
    return NextResponse.redirect(new URL("/learn/courses", request.url));
  }
  if (pathname.startsWith("/college-admin") && !role.isAdmin && !role.isSuperAdmin) {
    return NextResponse.redirect(new URL("/learn/courses", request.url));
  }
  if (pathname.startsWith("/mentor") && !role.isMentor && !role.isSuperAdmin) {
    if (role.isFaculty) return NextResponse.redirect(new URL("/teacher/courses", request.url));
    if (role.isAdmin) return NextResponse.redirect(new URL("/college-admin/dashboard", request.url));
    return NextResponse.redirect(new URL("/learn/courses", request.url));
  }
  if (pathname.startsWith("/teacher") && (!role.isFaculty || role.isMentor) && !role.isSuperAdmin) {
    if (role.isMentor) return NextResponse.redirect(new URL("/mentor/projects", request.url));
    return NextResponse.redirect(new URL("/learn/courses", request.url));
  }
  if (pathname.startsWith("/learn") && !role.isLearner && !role.isSuperAdmin) {
    if (role.isAdmin) return NextResponse.redirect(new URL("/college-admin/dashboard", request.url));
    if (role.isMentor) return NextResponse.redirect(new URL("/mentor/projects", request.url));
    if (role.isMentor) return NextResponse.redirect(new URL("/mentor/projects", request.url));
    if (role.isFaculty) return NextResponse.redirect(new URL("/teacher/courses", request.url));
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
