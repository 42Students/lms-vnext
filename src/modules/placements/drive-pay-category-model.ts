/** Legacy TPO drive pay category (docs/legacy-source/frontend/src/components/tpo/DriveFormPage.js
 * categoryFromCtc + the manual override with a required reason).
 *
 * Regular / Dream / Super dream are derived from the HIGHEST CTC on the drive
 * (>= 20 LPA Super dream, >= 10 LPA Dream). A TPO may override the derived
 * tier, but an override always carries a reason. */
export const DRIVE_PAY_CATEGORIES = ["REGULAR", "DREAM", "SUPER_DREAM"] as const;
export type DrivePayCategory = (typeof DRIVE_PAY_CATEGORIES)[number];

export const DRIVE_PAY_CATEGORY_LABEL: Readonly<Record<DrivePayCategory, string>> = {
  REGULAR: "Regular",
  DREAM: "Dream",
  SUPER_DREAM: "Super dream",
};

export const DRIVE_PAY_CATEGORY_REASON_MAX = 500;
export const DRIVE_PAY_CATEGORY_REASON_REQUIRED = "A reason is required";

export function drivePayCategoryFromMaxCtcLpa(
  maxCtcLpa: number | null | undefined,
): DrivePayCategory {
  const max = typeof maxCtcLpa === "number" && Number.isFinite(maxCtcLpa) ? maxCtcLpa : 0;
  return max >= 20 ? "SUPER_DREAM" : max >= 10 ? "DREAM" : "REGULAR";
}

export function drivePayCategoryFromMaxAnnualCtcInr(
  maxAnnualCtcInr: number | null | undefined,
): DrivePayCategory {
  return drivePayCategoryFromMaxCtcLpa(
    typeof maxAnnualCtcInr === "number" ? maxAnnualCtcInr / 100_000 : null,
  );
}

export function isDrivePayCategory(value: unknown): value is DrivePayCategory {
  return typeof value === "string" &&
    (DRIVE_PAY_CATEGORIES as readonly string[]).includes(value);
}

/** An override (explicit category) requires a reason; no override carries none. */
export function drivePayCategoryOverrideIssue(input: {
  legacyJobCategory?: DrivePayCategory | null;
  categoryOverrideReason?: string | null;
}): { path: "categoryOverrideReason" | "legacyJobCategory"; message: string } | null {
  const reason = input.categoryOverrideReason?.trim() ?? "";
  if (input.legacyJobCategory && reason.length === 0) {
    return { path: "categoryOverrideReason", message: DRIVE_PAY_CATEGORY_REASON_REQUIRED };
  }
  if (!input.legacyJobCategory && reason.length > 0) {
    return { path: "legacyJobCategory", message: "Choose a category to override." };
  }
  return null;
}
