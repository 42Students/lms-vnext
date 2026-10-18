import { z } from "zod";

/**
 * College branding: validation plus the colour maths that keeps a college's
 * brand colour readable inside the LMS shell. Pure, so it is unit tested.
 */

const nullableText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      const trimmed = typeof value === "string" ? value.trim() : value;
      return trimmed === "" || trimmed === undefined ? null : trimmed;
    })
    .pipe(z.string().max(max).nullable());

/** https only: no javascript:, data:, http: or credentials in the URL. */
const httpsUrl = nullableText(2048).refine(
  (value) => {
    if (value === null) return true;
    if (/\s/.test(value)) return false;
    try {
      const url = new URL(value);
      return (
        url.protocol === "https:" &&
        url.username === "" &&
        url.password === "" &&
        url.hostname.includes(".")
      );
    } catch {
      return false;
    }
  },
  "Must be a full https:// URL",
);

const hexColor = nullableText(7).refine(
  (value) => value === null || /^#[0-9a-fA-F]{6}$/.test(value),
  "Must be a colour like #1A95A1",
);

export const collegeBrandingInputSchema = z
  .object({
    logoUrl: httpsUrl,
    faviconUrl: httpsUrl,
    loginBackgroundUrl: httpsUrl,
    loginBackgroundUrlMobile: httpsUrl,
    primaryColor: hexColor.transform((v) => v?.toUpperCase() ?? null),
    secondaryColor: hexColor.transform((v) => v?.toUpperCase() ?? null),
    supportEmail: nullableText(320).refine(
      (value) =>
        value === null || z.string().email().safeParse(value).success,
      "Must be a valid email address",
    ),
    supportPhone: nullableText(32).refine(
      (value) => value === null || /^\+?[0-9][0-9 ()-]{5,30}$/.test(value),
      "Must be a phone number",
    ),
    termsUrl: httpsUrl,
    privacyUrl: httpsUrl,
  })
  .strict();

export type CollegeBrandingInput = z.infer<typeof collegeBrandingInputSchema>;

/** Optimistic version supplied by an editor, never by tenant identity. */
export const collegeBrandingSaveSchema=collegeBrandingInputSchema.extend({
 expectedVersion:z.number().int().nonnegative(),
});
const BRANDING_KEYS=[
 "logoUrl","faviconUrl","loginBackgroundUrl","loginBackgroundUrlMobile",
 "primaryColor","secondaryColor","supportEmail","supportPhone",
 "termsUrl","privacyUrl",
] as const satisfies readonly (keyof CollegeBrandingInput)[];

export function sameCollegeBranding(
 stored:CollegeBrandingInput,input:CollegeBrandingInput,
):boolean{
 return BRANDING_KEYS.every(key=>stored[key]===input[key]);
}

// ---- colour maths (WCAG 2.x relative luminance) --------------------------

type Rgb = readonly [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const value = hex.replace("#", "");
  return [
    parseInt(value.slice(0, 2), 16),
    parseInt(value.slice(2, 4), 16),
    parseInt(value.slice(4, 6), 16),
  ];
}

export function rgbToHex([r, g, b]: Rgb) {
  const part = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

function luminance(rgb: Rgb) {
  const [r, g, b] = rgb.map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string) {
  const la = luminance(hexToRgb(a));
  const lb = luminance(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

function mix(a: Rgb, b: Rgb, weightOfB: number): Rgb {
  return [
    a[0] + (b[0] - a[0]) * weightOfB,
    a[1] + (b[1] - a[1]) * weightOfB,
    a[2] + (b[2] - a[2]) * weightOfB,
  ];
}

const WHITE = "#FFFFFF";
const INK = "#1A1D21";
const BLACK = "#000000";

export type BrandTokens = {
  primary: string;
  /** text colour to use ON the primary colour (white or ink, whichever reads) */
  onPrimary: string;
  hover: string;
  /** primary used as text on white: darkened until it reaches 4.5:1 */
  text: string;
  subtle: string;
};

export function deriveBrandTokens(primaryHex: string): BrandTokens {
  const primary = rgbToHex(hexToRgb(primaryHex));
  const rgb = hexToRgb(primary);

  // White if it reads, else the LMS ink, else pure black. Black always
  // reaches 4.5:1 for every colour, so the result is never unreadable.
  const onPrimary =
    contrastRatio(primary, WHITE) >= 4.5
      ? WHITE
      : contrastRatio(primary, INK) >= 4.5
        ? INK
        : BLACK;

  // Hover moves away from the text colour so it stays distinguishable.
  const hover = rgbToHex(
    onPrimary === WHITE ? mix(rgb, [0, 0, 0], 0.14) : mix(rgb, [255, 255, 255], 0.18),
  );

  let text = primary;
  for (let step = 0; step < 20 && contrastRatio(text, WHITE) < 4.5; step += 1) {
    text = rgbToHex(mix(hexToRgb(text), [0, 0, 0], 0.1));
  }

  const subtle = rgbToHex(mix([255, 255, 255], rgb, 0.08));

  return { primary, onPrimary, hover, text, subtle };
}

/**
 * CSS custom properties that re-theme a subtree. The Tailwind utilities read
 * the shadcn-style aliases (--primary, --ring, ...), which are resolved at
 * :root, so the whole alias family is overridden, not just --lms-primary.
 */
export function brandStyleVariables(
  primaryHex: string | null | undefined,
): Record<string, string> {
  if (!primaryHex || !/^#[0-9a-fA-F]{6}$/.test(primaryHex)) return {};

  const t = deriveBrandTokens(primaryHex);
  const [r, g, b] = hexToRgb(t.primary);

  return {
    "--lms-primary": t.primary,
    "--lms-primary-hover": t.hover,
    "--lms-primary-text": t.text,
    "--lms-primary-subtle": t.subtle,
    "--lms-sidebar-active": `rgba(${r}, ${g}, ${b}, 0.15)`,
    "--lms-focus-ring": `rgba(${r}, ${g}, ${b}, 0.2)`,
    "--primary": t.primary,
    "--primary-foreground": t.onPrimary,
    "--accent": t.subtle,
    "--accent-foreground": t.text,
    "--ring": t.primary,
  };
}
