/**
 * Per-college presentation (legacy: CollegeBranding / public tenant branding).
 * One row per college. Everything is optional; a college with no row simply
 * uses the LMS defaults. Only https URLs and #RRGGBB colours are accepted at
 * the database level so a bad value can never reach a page.
 */
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

const httpsUrl = (column: string) =>
  sql.raw(
    `"${column}" IS NULL OR ("${column}" ~ '^https://[^[:space:]]+$' AND char_length("${column}") <= 2048)`,
  );

const hexColor = (column: string) =>
  sql.raw(`"${column}" IS NULL OR "${column}" ~ '^#[0-9A-Fa-f]{6}$'`);

export const collegeBranding = pgTable(
  "college_branding",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    /** Historical branding ID and login preference are import-only snapshots. */
    legacyBrandingId: integer("legacy_branding_id"),
    legacyCollegeId: integer("legacy_college_id"),
    legacyLoginMethods: varchar("legacy_login_methods", { length: 32 }),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    /** Historical logo path is quarantined until imported into verified storage. */
    legacyLogoSourceUrl: text("legacy_logo_source_url"),
    legacyBrandingArchivedAt: timestamp("legacy_branding_archived_at",{withTimezone:true}),
    logoUrl: text("logo_url"),
    faviconUrl: text("favicon_url"),
    loginBackgroundUrl: text("login_background_url"),
    loginBackgroundUrlMobile: text("login_background_url_mobile"),
    primaryColor: varchar("primary_color", { length: 7 }),
    secondaryColor: varchar("secondary_color", { length: 7 }),
    supportEmail: varchar("support_email", { length: 320 }),
    supportPhone: varchar("support_phone", { length: 32 }),
    termsUrl: text("terms_url"),
    privacyUrl: text("privacy_url"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check("college_branding_version_ck", sql`${table.version} >= 1`),
    check("college_branding_logo_url_ck", httpsUrl("logo_url")),
    check("college_branding_favicon_url_ck", httpsUrl("favicon_url")),
    check(
      "college_branding_login_bg_url_ck",
      httpsUrl("login_background_url"),
    ),
    check(
      "college_branding_login_bg_mobile_url_ck",
      httpsUrl("login_background_url_mobile"),
    ),
    check("college_branding_terms_url_ck", httpsUrl("terms_url")),
    check("college_branding_privacy_url_ck", httpsUrl("privacy_url")),
    check(
      "college_branding_primary_color_ck",
      hexColor("primary_color"),
    ),
    check(
      "college_branding_secondary_color_ck",
      hexColor("secondary_color"),
    ),
  ],
);

/** Imported branding must resolve the historical college under its owning org. */
export function normalizeLegacyCollegeBranding(input: {
  legacyCollegeId: number; legacyBrandingId: number | null;
  isDeleted: boolean | null; logoUrl: string | null;
}, mappedColleges: ReadonlyMap<number,string>) {
  const collegeId = mappedColleges.get(input.legacyCollegeId);
  if (!collegeId) return null;
  // Source URLs cannot be served from this schema without trusted upload/signing.
  return {collegeId,legacyCollegeId:input.legacyCollegeId,
    legacyBrandingId:input.legacyBrandingId,legacyWasDeleted:input.isDeleted,
    legacyLogoSourceUrl:input.logoUrl,logoUrl:null,
    legacyBrandingArchivedAt: input.isDeleted === true ? new Date(0) : null};
}
