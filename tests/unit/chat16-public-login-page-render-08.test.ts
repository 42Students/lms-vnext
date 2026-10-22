import { beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { resolveRequestTenant } from "@/modules/auth/request-tenant";
import { getPublicCollegeBranding } from "@/modules/colleges/branding-service";
import { effectiveCollegeSignInCapabilities } from "@/modules/colleges/public-signin-policy-service";
import HomePage, { generateMetadata } from "@/app/page";

vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/auth/request-context", () => ({ getCurrentRequestContext: vi.fn() }));
vi.mock("@/modules/auth/request-tenant", () => ({ resolveRequestTenant: vi.fn() }));
vi.mock("@/modules/colleges/branding-service", () => ({ getPublicCollegeBranding: vi.fn() }));
vi.mock("@/modules/colleges/branding", () => ({ brandStyleVariables: vi.fn(() => ({})), publicLoginStyleVariables: vi.fn(() => ({})) }));
vi.mock("@/modules/colleges/public-signin-policy-service", () => ({
  effectiveCollegeSignInCapabilities: vi.fn(),
}));
vi.mock("@/components/auth/login-form", () => ({
  LoginForm: ({ collegeName, allowedChannels }: {
    collegeName?: string | null; allowedChannels: readonly string[];
  }) => createElement("div", {
    "data-otp-login": "true", "data-college": collegeName ?? "",
    "data-channels": allowedChannels.join(","),
  }, "One-time code sign-in"),
}));

const collegeId = "11111111-1111-4111-8111-111111111111";
const params = (options: Record<string, string | string[]> = {}) =>
  ({ searchParams: Promise.resolve(options) });
const html = async (options: Record<string, string | string[]> = {}) =>
  renderToStaticMarkup(await HomePage(params(options)));

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(headers).mockResolvedValue(new Headers({
    host: "platform.example.org", "x-lms-path": "/login",
  }) as never);
  vi.mocked(redirect).mockImplementation((target) => {
    throw new Error("REDIRECT:" + target);
  });
  vi.mocked(getCurrentRequestContext).mockRejectedValue(new Error("anonymous"));
  vi.mocked(resolveRequestTenant).mockResolvedValue({ kind: "platform" } as never);
  vi.mocked(getPublicCollegeBranding).mockResolvedValue(null);
  vi.mocked(effectiveCollegeSignInCapabilities).mockResolvedValue({
    primary: "EMAIL", email: true, phone: true,
  } as never);
});

describe("chat-16 direct public sign-in page render and tenant/OTP journeys", () => {
  it("AUTH-PAGE-OTP-01 renders the actual login route with both permitted OTP channels", async () => {
    const page = await html();
    expect(page).toContain("One-time code sign-in");
    expect(page).toContain('data-channels="EMAIL,PHONE"');
    expect(page).toContain("Sign in with the phone number or email");
    expect(page).toContain("min-h-dvh");
  });

  it("AUTH-PAGE-OTP-02 honors college channel policy and never renders a disallowed SMS action", async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({ kind: "college", collegeId } as never);
    vi.mocked(effectiveCollegeSignInCapabilities).mockResolvedValue({
      primary: "EMAIL", email: true, phone: false,
    } as never);
    const page = await html();
    expect(page).toContain('data-channels="EMAIL"');
    expect(page).not.toContain('data-channels="EMAIL,PHONE"');
    expect(effectiveCollegeSignInCapabilities).toHaveBeenCalledWith(collegeId);
  });

  it("AUTH-PAGE-OTP-03 shows a recovery alert after an expired session and preserves sign-in", async () => {
    const page = await html({ auth: "expired", returnTo: "/hr/conversations" });
    expect(page).toContain("Your session expired. Please log in again.");
    expect(page).toContain('role="alert"');
    expect(page).toContain("One-time code sign-in");
    expect(page).not.toContain("private-session-token");
  });

  it("AUTH-PAGE-TENANT-04 unknown and temporarily unavailable hosts are safe fallback states", async () => {
    for (const kind of ["unknown", "unavailable"] as const) {
      vi.mocked(resolveRequestTenant).mockResolvedValue({ kind } as never);
      const page = await html();
      expect(page).toContain("Use the main sign-in page");
      expect(page).not.toContain("One-time code sign-in");
    }
  });

  it("AUTH-PAGE-TENANT-05 platform marketing route redirects without a forced login", async () => {
    vi.mocked(headers).mockResolvedValue(new Headers({
      host: "platform.example.org", "x-lms-path": "/",
    }) as never);
    await expect(HomePage(params())).rejects.toThrow("REDIRECT:/home");
  });

  it("AUTH-PAGE-SESSION-06 active session may redirect only to a safe internal return URL", async () => {
    vi.mocked(getCurrentRequestContext).mockResolvedValue({ user: { id: "u" } } as never);
    await expect(HomePage(params({ returnTo: "/hr/conversations?page=2" })))
      .rejects.toThrow("REDIRECT:/hr/conversations?page=2");
    await expect(HomePage(params({ returnTo: "https://evil.example.org/steal" })))
      .rejects.toThrow("REDIRECT:/dashboard");
  });

  it("AUTH-PAGE-BRANDING-07 gives college-bound OTP login its own title", async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValue({ kind: "college", collegeId } as never);
    vi.mocked(getPublicCollegeBranding).mockResolvedValue({
      collegeName: "IIT Dharwad",
    } as never);
    expect(await generateMetadata(params())).toMatchObject({ title: { absolute: "Sign in · IIT Dharwad" } });
    expect(await html()).toContain('data-college="IIT Dharwad"');
  });
});
