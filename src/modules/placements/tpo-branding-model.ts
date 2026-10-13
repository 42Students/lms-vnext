import {
  collegeBrandingInputSchema,
} from "@/modules/colleges/branding";

export type TpoBrandingOrigin =
  | "PERSISTED"
  | "SOURCE_DEFAULT";

export type TpoBrandingSnapshot = {
  collegeName: string;
  brandingRecordExists: boolean;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
};

export type TpoBrandingField = {
  value: string | null;
  source: TpoBrandingOrigin;
};

export type TpoPlacementBrandingView = {
  collegeName: string;
  brandingSource: TpoBrandingOrigin;
  logo: TpoBrandingField;
  logoPreviewUrl: string | null;
  logoPreviewSuppressed: boolean;
  primaryColor: TpoBrandingField;
  secondaryColor: TpoBrandingField;
};

/**
 * Preview only publicly addressed HTTPS images.
 *
 * The existing College Admin branding validation
 * enforces HTTPS, valid public hostnames, no embedded
 * username/password and a bounded URL length.
 *
 * Additional precaution: exclude query strings and
 * fragments so a signed URL or token-like parameter
 * is not rendered into this authenticated page.
 *
 * Never turn a private storage object key into a URL.
 */
export function safeTpoBrandLogoUrl(
  rawUrl: string | null | undefined,
): string | null {
  if (!rawUrl) return null;

  const parsed = collegeBrandingInputSchema.safeParse({
    logoUrl: rawUrl,
  });

  if (!parsed.success || !parsed.data.logoUrl) {
    return null;
  }

  const value = parsed.data.logoUrl;

  try {
    const url = new URL(value);

    if (url.search || url.hash) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

/** Only persisted, well-formed hex colours get inline swatches. */
export function safeTpoBrandColor(
  rawColor: string | null | undefined,
): string | null {
  if (
    !rawColor ||
    !/^#[0-9A-Fa-f]{6}$/.test(rawColor)
  ) {
    return null;
  }

  return rawColor.toUpperCase();
}

export function describeTpoPlacementBranding(
  input: TpoBrandingSnapshot,
): TpoPlacementBrandingView {
  const logoUrl = input.brandingRecordExists
    ? input.logoUrl
    : null;

  const safeLogoUrl = safeTpoBrandLogoUrl(logoUrl);

  const primaryColor = input.brandingRecordExists
    ? safeTpoBrandColor(input.primaryColor)
    : null;

  const secondaryColor = input.brandingRecordExists
    ? safeTpoBrandColor(input.secondaryColor)
    : null;

  const field = (value: string | null): TpoBrandingField => ({
    value,
    source: value
      ? "PERSISTED"
      : "SOURCE_DEFAULT",
  });

  return {
    collegeName: input.collegeName,
    brandingSource: input.brandingRecordExists
      ? "PERSISTED"
      : "SOURCE_DEFAULT",
    logo: field(safeLogoUrl),
    logoPreviewUrl: safeLogoUrl,
    logoPreviewSuppressed: Boolean(
      logoUrl && !safeLogoUrl,
    ),
    primaryColor: field(primaryColor),
    secondaryColor: field(secondaryColor),
  };
}

export function tpoBrandingOriginLabel(
  origin: TpoBrandingOrigin,
): string {
  return origin === "PERSISTED"
    ? "Persisted"
    : "Source default";
}
