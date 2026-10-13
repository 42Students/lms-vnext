import { describe, expect, it } from "vitest";
import {
  brandStyleVariables,
  collegeBrandingInputSchema,
  contrastRatio,
  deriveBrandTokens,
} from "@/modules/colleges/branding";

const parse = (value: unknown) => collegeBrandingInputSchema.safeParse(value);

describe("college branding input", () => {
  it("accepts a complete, valid branding", () => {
    const result = parse({
      logoUrl: "https://cdn.example.edu/logo.png",
      faviconUrl: "https://cdn.example.edu/favicon.ico",
      loginBackgroundUrl: "https://cdn.example.edu/bg.jpg",
      loginBackgroundUrlMobile: "https://cdn.example.edu/bg-m.jpg",
      primaryColor: "#1a95a1",
      secondaryColor: "#0e7c87",
      supportEmail: "help@example.edu",
      supportPhone: "+91 98765 43210",
      termsUrl: "https://example.edu/terms",
      privacyUrl: "https://example.edu/privacy",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.primaryColor).toBe("#1A95A1");
    }
  });

  it("turns blank and missing values into null so a field can be cleared", () => {
    const result = parse({ logoUrl: "   ", primaryColor: "", supportEmail: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.logoUrl).toBeNull();
      expect(result.data.primaryColor).toBeNull();
      expect(result.data.supportEmail).toBeNull();
      expect(result.data.faviconUrl).toBeNull();
    }
  });

  it.each([
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "http://example.edu/logo.png",
    "https://user:pass@example.edu/logo.png",
    "https://localhost/logo.png",
    "https://exa mple.edu/logo.png",
    "//example.edu/logo.png",
    "not a url",
  ])("rejects the unsafe or malformed URL %s", (url) => {
    expect(parse({ logoUrl: url }).success).toBe(false);
  });

  it.each(["red", "#12345", "#GGGGGG", "1a95a1", "#1a95a1ff"])(
    "rejects the colour %s",
    (color) => {
      expect(parse({ primaryColor: color }).success).toBe(false);
    },
  );

  it("rejects unknown fields", () => {
    expect(parse({ logoUrl: null, collegeId: "x" }).success).toBe(false);
  });

  it("rejects a bad email and a bad phone", () => {
    expect(parse({ supportEmail: "nope" }).success).toBe(false);
    expect(parse({ supportPhone: "call me" }).success).toBe(false);
  });
});

describe("contrast maths", () => {
  it("matches known WCAG ratios", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 0);
    expect(contrastRatio("#FFFFFF", "#FFFFFF")).toBeCloseTo(1, 5);
  });
});

describe("deriveBrandTokens", () => {
  const colors = [
    "#26BAC7", // LMS teal (light)
    "#1A95A1",
    "#FFFF00", // very light
    "#000000",
    "#7F7F7F", // mid grey, the hardest case
    "#C0392B",
    "#2C3E50",
    "#FFFFFF",
  ];

  it.each(colors)("keeps %s readable everywhere it is used", (color) => {
    const t = deriveBrandTokens(color);
    // text placed on the brand colour
    expect(contrastRatio(t.primary, t.onPrimary)).toBeGreaterThanOrEqual(4.5);
    // the hover state keeps the same text readable
    expect(contrastRatio(t.hover, t.onPrimary)).toBeGreaterThanOrEqual(4.5);
    // brand colour used as link/text on a white page
    expect(contrastRatio(t.text, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
    // the tint stays very light
    expect(contrastRatio(t.subtle, "#FFFFFF")).toBeLessThan(1.3);
  });

  it("chooses dark text on a light brand colour and white on a dark one", () => {
    expect(deriveBrandTokens("#FFFF00").onPrimary).toBe("#1A1D21");
    expect(deriveBrandTokens("#7F7F7F").onPrimary).toBe("#000000");
    expect(deriveBrandTokens("#2C3E50").onPrimary).toBe("#FFFFFF");
  });
});

describe("brandStyleVariables", () => {
  it("overrides the whole alias family the utilities actually read", () => {
    const vars = brandStyleVariables("#C0392B");
    for (const key of [
      "--lms-primary",
      "--primary",
      "--primary-foreground",
      "--ring",
      "--accent",
      "--accent-foreground",
      "--lms-primary-hover",
      "--lms-focus-ring",
      "--lms-sidebar-active",
    ]) {
      expect(vars[key], key).toBeTruthy();
    }
    expect(vars["--primary"]).toBe("#C0392B");
  });

  it("changes nothing when there is no valid colour", () => {
    expect(brandStyleVariables(null)).toEqual({});
    expect(brandStyleVariables("blue")).toEqual({});
  });
});
