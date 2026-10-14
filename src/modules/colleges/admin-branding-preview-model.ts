import {
  brandStyleVariables,
  deriveBrandTokens,
} from "@/modules/colleges/branding";
import {
  safeTpoBrandColor,
  safeTpoBrandLogoUrl,
} from "@/modules/placements/tpo-branding-model";

export const LMS_DEFAULT_BRAND_PRIMARY = "#26BAC7";
export const LMS_DEFAULT_BRAND_SECONDARY = "#1E363F";

export type StoredCollegeBranding = {
  logoUrl: string | null;
  faviconUrl: string | null;
  loginBackgroundUrl: string | null;
  loginBackgroundUrlMobile: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  supportEmail: string | null;
  supportPhone: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
};

export type AdminCollegeBrandingInput = {
  college: { id: string; name: string; code: string; status: string };
  branding: StoredCollegeBranding | null;
};

function safeSupportEmail(value: string | null): string | null {
  return value && value.length <= 320 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ? value : null;
}

function safeSupportPhone(value: string | null): string | null {
  return value && value.length <= 32 &&
    /^\+?[0-9][0-9 ()-]{5,30}$/.test(value)
    ? value : null;
}

/**
 * All public image and policy URLs use the existing TPO preview safety
 * helper, which validates the college-branding HTTPS rules and rejects
 * credential, query-string and fragment URLs. No private object paths.
 */
export function describeAdminCollegeBranding(input: AdminCollegeBrandingInput) {
  const stored = input.branding;
  const logoUrl = safeTpoBrandLogoUrl(stored?.logoUrl);
  const faviconUrl = safeTpoBrandLogoUrl(stored?.faviconUrl);
  const desktopBackgroundUrl = safeTpoBrandLogoUrl(stored?.loginBackgroundUrl);
  const mobileOverride = safeTpoBrandLogoUrl(stored?.loginBackgroundUrlMobile);
  const mobileBackgroundUrl = mobileOverride ?? desktopBackgroundUrl;
  const primaryOverride = safeTpoBrandColor(stored?.primaryColor);
  const secondaryOverride = safeTpoBrandColor(stored?.secondaryColor);
  const primary = primaryOverride ?? LMS_DEFAULT_BRAND_PRIMARY;
  const secondary = secondaryOverride ?? LMS_DEFAULT_BRAND_SECONDARY;
  const termsUrl = safeTpoBrandLogoUrl(stored?.termsUrl);
  const privacyUrl = safeTpoBrandLogoUrl(stored?.privacyUrl);

  return {
    college: input.college,
    brandingStored: stored !== null,
    logoUrl,
    faviconUrl,
    desktopBackgroundUrl,
    mobileBackgroundUrl,
    mobileBackgroundFallback: !mobileOverride && Boolean(desktopBackgroundUrl),
    primaryOverride,
    secondaryOverride,
    primary,
    secondary,
    tokens: deriveBrandTokens(primary),
    styleVariables: brandStyleVariables(primary),
    supportEmail: safeSupportEmail(stored?.supportEmail ?? null),
    supportPhone: safeSupportPhone(stored?.supportPhone ?? null),
    termsUrl,
    privacyUrl,
    suppressed: {
      logo: Boolean(stored?.logoUrl && !logoUrl),
      favicon: Boolean(stored?.faviconUrl && !faviconUrl),
      desktopBackground: Boolean(stored?.loginBackgroundUrl && !desktopBackgroundUrl),
      mobileBackground: Boolean(stored?.loginBackgroundUrlMobile && !mobileOverride),
      terms: Boolean(stored?.termsUrl && !termsUrl),
      privacy: Boolean(stored?.privacyUrl && !privacyUrl),
    },
  };
}

export type AdminCollegeBrandingPreview = ReturnType<
  typeof describeAdminCollegeBranding
>;
