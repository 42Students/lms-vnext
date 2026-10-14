import { describe, expect, it } from "vitest";
import {
  describeAdminCollegeBranding,
  LMS_DEFAULT_BRAND_PRIMARY,
  LMS_DEFAULT_BRAND_SECONDARY,
  type StoredCollegeBranding,
} from "@/modules/colleges/admin-branding-preview-model";

const college = {
  id: "college-a",
  name: "Example College",
  code: "EXAMPLE",
  status: "ACTIVE",
};

const stored: StoredCollegeBranding = {
  logoUrl: "https://cdn.example.edu/logo.png",
  faviconUrl: null,
  loginBackgroundUrl: "https://cdn.example.edu/desktop.jpg",
  loginBackgroundUrlMobile: null,
  primaryColor: "#1a95a1",
  secondaryColor: "#123456",
  supportEmail: "help@example.edu",
  supportPhone: "+91 1234567890",
  termsUrl: "https://example.edu/terms",
  privacyUrl: "https://example.edu/privacy",
};

describe("Super Admin college branding preview model", () => {
  it("distinguishes missing persistence from stored settings", () => {
    const view = describeAdminCollegeBranding({ college, branding: null });
    expect(view.brandingStored).toBe(false);
    expect(view.primary).toBe(LMS_DEFAULT_BRAND_PRIMARY);
    expect(view.secondary).toBe(LMS_DEFAULT_BRAND_SECONDARY);
    expect(view.logoUrl).toBeNull();
    expect(view.mobileBackgroundUrl).toBeNull();
  });

  it("projects public images and support links with responsive fallback", () => {
    const view = describeAdminCollegeBranding({ college, branding: stored });
    expect(view.brandingStored).toBe(true);
    expect(view.logoUrl).toBe("https://cdn.example.edu/logo.png");
    expect(view.desktopBackgroundUrl).toBe("https://cdn.example.edu/desktop.jpg");
    expect(view.mobileBackgroundUrl).toBe(view.desktopBackgroundUrl);
    expect(view.mobileBackgroundFallback).toBe(true);
    expect(view.primary).toBe("#1A95A1");
    expect(view.secondary).toBe("#123456");
    expect(view.tokens.primary).toBe("#1A95A1");
    expect(view.styleVariables["--lms-primary"]).toBe("#1A95A1");
    expect(view.supportEmail).toBe("help@example.edu");
    expect(view.supportPhone).toBe("+91 1234567890");
    expect(view.termsUrl).toBe("https://example.edu/terms");
  });

  it("prefers an explicitly configured safe mobile image", () => {
    const view = describeAdminCollegeBranding({
      college,
      branding: {
        ...stored,
        loginBackgroundUrlMobile: "https://cdn.example.edu/mobile.jpg",
      },
    });
    expect(view.mobileBackgroundFallback).toBe(false);
    expect(view.mobileBackgroundUrl).toBe("https://cdn.example.edu/mobile.jpg");
  });

  it.each([
    "http://example.edu/logo.png",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "/private/logo.png",
    "colleges/private/logo.png",
    "https://user:secret@example.edu/logo.png",
    "https://example.edu/logo.png?signature=secret",
    "https://example.edu/logo.png#fragment",
  ])("suppresses non-public preview image URL %s", (url) => {
    const view = describeAdminCollegeBranding({
      college,
      branding: { ...stored, logoUrl: url, loginBackgroundUrl: url },
    });
    expect(view.logoUrl).toBeNull();
    expect(view.desktopBackgroundUrl).toBeNull();
    expect(view.suppressed.logo).toBe(true);
    expect(view.suppressed.desktopBackground).toBe(true);
  });

  it("filters invalid colours and support links without leaking unsafe values", () => {
    const view = describeAdminCollegeBranding({
      college,
      branding: {
        ...stored,
        primaryColor: "url(javascript:alert(1))",
        secondaryColor: "invalid",
        termsUrl: "https://example.edu/terms?token=secret",
        privacyUrl: "http://example.edu/privacy",
        supportEmail: "not-an-email",
        supportPhone: "unsafe;value",
      },
    });
    expect(view.primary).toBe(LMS_DEFAULT_BRAND_PRIMARY);
    expect(view.secondary).toBe(LMS_DEFAULT_BRAND_SECONDARY);
    expect(view.termsUrl).toBeNull();
    expect(view.privacyUrl).toBeNull();
    expect(view.supportEmail).toBeNull();
    expect(view.supportPhone).toBeNull();
    expect(view.suppressed.terms).toBe(true);
    expect(view.suppressed.privacy).toBe(true);
  });

  it("never returns private college storage paths or editing commands", () => {
    const view = describeAdminCollegeBranding({ college, branding: stored });
    expect(Object.keys(view)).not.toContain("logoObjectPath");
    expect(Object.keys(view.college)).not.toContain("logoObjectPath");
    expect(Object.keys(view)).not.toContain("save");
  });
});
