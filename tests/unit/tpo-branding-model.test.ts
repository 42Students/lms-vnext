import { describe, expect, it } from "vitest";

import {
  describeTpoPlacementBranding,
  safeTpoBrandColor,
  safeTpoBrandLogoUrl,
  tpoBrandingOriginLabel,
} from "@/modules/placements/tpo-branding-model";

describe("TPO public logo preview safety", () => {
  it("accepts an existing valid public HTTPS logo", () => {
    expect(
      safeTpoBrandLogoUrl(
        "https://cdn.example.edu/college/logo.png",
      ),
    ).toBe(
      "https://cdn.example.edu/college/logo.png",
    );
  });

  it.each([
    "http://cdn.example.edu/logo.png",
    "javascript:alert(1)",
    "data:image/png;base64,AAAA",
    "/private/college-logo.png",
    "colleges/private/logo.png",
    "https://user:password@example.edu/logo.png",
    "https://localhost/logo.png",
    "https://cdn.example.edu/logo.png?token=secret",
    "https://cdn.example.edu/logo.png#fragment",
    "https://exa mple.edu/logo.png",
    "",
  ])("rejects a non-public or unsafe logo address: %s", (value) => {
    expect(
      safeTpoBrandLogoUrl(value),
    ).toBeNull();
  });

  it("does not invent a logo from an absent address", () => {
    expect(
      safeTpoBrandLogoUrl(null),
    ).toBeNull();
    expect(
      safeTpoBrandLogoUrl(undefined),
    ).toBeNull();
  });
});

describe("TPO branding colours", () => {
  it("normalizes valid stored hex values", () => {
    expect(
      safeTpoBrandColor("#1a95a1"),
    ).toBe("#1A95A1");

    expect(
      safeTpoBrandColor("#000000"),
    ).toBe("#000000");
  });

  it.each([
    "red",
    "#12345",
    "#GGGGGG",
    "var(--primary)",
    "url(javascript:alert(1))",
    "",
  ])("rejects malformed colour values: %s", (value) => {
    expect(
      safeTpoBrandColor(value),
    ).toBeNull();
  });
});

describe("TPO placement branding projection", () => {
  const base = {
    collegeName: "Example College",
    brandingRecordExists: false,
    logoUrl: null,
    primaryColor: null,
    secondaryColor: null,
  };

  it("keeps a missing branding row separate from the persisted college name", () => {
    const result =
      describeTpoPlacementBranding(base);

    expect(result).toMatchObject({
      collegeName: "Example College",
      brandingSource: "SOURCE_DEFAULT",
      logoPreviewUrl: null,
      logoPreviewSuppressed: false,
      logo: {
        value: null,
        source: "SOURCE_DEFAULT",
      },
      primaryColor: {
        value: null,
        source: "SOURCE_DEFAULT",
      },
      secondaryColor: {
        value: null,
        source: "SOURCE_DEFAULT",
      },
    });
  });

  it("reports persisted logo and colour overrides", () => {
    const result =
      describeTpoPlacementBranding({
        ...base,
        brandingRecordExists: true,
        logoUrl:
          "https://cdn.example.edu/logo.png",
        primaryColor: "#1a95a1",
        secondaryColor: "#0e7c87",
      });

    expect(result.brandingSource).toBe(
      "PERSISTED",
    );
    expect(result.logo).toEqual({
      value:
        "https://cdn.example.edu/logo.png",
      source: "PERSISTED",
    });
    expect(result.primaryColor).toEqual({
      value: "#1A95A1",
      source: "PERSISTED",
    });
    expect(result.secondaryColor).toEqual({
      value: "#0E7C87",
      source: "PERSISTED",
    });
  });

  it("preserves fallback labels for unset fields on a persisted row", () => {
    const result =
      describeTpoPlacementBranding({
        ...base,
        brandingRecordExists: true,
        primaryColor: "#26BAC7",
      });

    expect(result.brandingSource).toBe(
      "PERSISTED",
    );
    expect(result.primaryColor.source).toBe(
      "PERSISTED",
    );
    expect(result.secondaryColor.source).toBe(
      "SOURCE_DEFAULT",
    );
    expect(result.logo.source).toBe(
      "SOURCE_DEFAULT",
    );
  });

  it("suppresses an unsafe stored logo without exposing its URL", () => {
    const result =
      describeTpoPlacementBranding({
        ...base,
        brandingRecordExists: true,
        logoUrl:
          "https://cdn.example.edu/logo.png?token=private",
      });

    expect(result.logoPreviewUrl).toBeNull();
    expect(result.logoPreviewSuppressed).toBe(
      true,
    );
    expect(result.logo.value).toBeNull();
  });

  it("does not project values without a persisted branding row", () => {
    const result =
      describeTpoPlacementBranding({
        ...base,
        logoUrl:
          "https://cdn.example.edu/logo.png",
        primaryColor: "#1A95A1",
      });

    expect(result.logoPreviewUrl).toBeNull();
    expect(result.primaryColor.value).toBeNull();
    expect(result.brandingSource).toBe(
      "SOURCE_DEFAULT",
    );
  });

  it("uses clear source labels", () => {
    expect(
      tpoBrandingOriginLabel("PERSISTED"),
    ).toBe("Persisted");

    expect(
      tpoBrandingOriginLabel("SOURCE_DEFAULT"),
    ).toBe("Source default");
  });
});
