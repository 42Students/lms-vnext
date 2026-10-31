import { z } from "zod";
import { BUG_ACCOUNT_ROLES, BUG_ENVIRONMENTS, BUG_SEVERITIES } from "./admin-validation";
import { LOCATION_OPTIONS, ISSUE_TYPE_OPTIONS } from "./report-form-options";

/** SA-placements-projects-100: exact legacy report intake; server revalidates all fields. */
export const trackerReportSchema = z.object({
  // The authenticated actor is checked against users.display_name in the
  // transactional service. A fixed five-person legacy picker cannot validate
  // arbitrary signed-in reporters and must not act as an identity authority.
  reporterName: z.string().trim().min(1, "Enter your account display name.").max(120),
  accountRole: z.enum(BUG_ACCOUNT_ROLES, { error: "Select the account you were testing." }),
  environment: z.enum(BUG_ENVIRONMENTS, { error: "Select where you saw the issue." }),
  page: z.string().trim().min(1, "Select the page and area.").max(120)
    .refine(value => LOCATION_OPTIONS.some(item => item.value === value), "Select the page and area."),
  screen: z.string().trim().max(120).nullable().optional(),
  section: z.string().trim().max(120).nullable().optional(),
  // Preserve the registered legacy taxonomy; unknown categories are not a
  // supported reporting channel and must not bypass the issue-type picker.
  issueType: z.string().trim().min(1, "Select the closest issue type.").max(80)
    .refine(value => ISSUE_TYPE_OPTIONS.some(item => item.value === value), "Select the closest issue type."),
  severity: z.enum(BUG_SEVERITIES),
  description: z.string().trim().min(1, "Describe what went wrong.")
    .max(4000, "Keep the description under 4000 characters."),
  evidenceLink: z.union([z.url({ protocol: /^https?$/ }).max(1000, "Evidence link is too long."), z.literal(""), z.null()]).optional(),
  sourceUrl: z.union([
    z.url({ protocol: /^https?$/ }).max(2000).refine(value => {
      try {
        const parsed = new URL(value);
        return Boolean(parsed.hostname) && !parsed.username && !parsed.password;
      } catch {
        return false;
      }
    }, "Enter a valid source URL."),
    z.literal(""),
    z.null(),
  ]).optional(),
  sourcePath: z.string().trim().max(500).refine(value=>!value.includes("?")&&!value.includes("#"),"Remove URL query parameters or fragments.").nullable().optional(),
  browser: z.string().trim().max(500).nullable().optional(),
  viewport: z.string().trim().max(64).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  const page = LOCATION_OPTIONS.find(option => option.value === value.page);
  if (!page) {
    // The field-level schema reports an invalid page, without echoing it to
    // unauthorized error consumers or attempting a broader data lookup.
    return;
  }
  const screen = page.children?.find(option => option.value === value.screen);
  if (page.children?.length && !screen) {
    ctx.addIssue({ code: "custom", path: ["screen"], message: "Select the page and area." });
  }
  if (value.section && !screen?.children?.some(option => option.value === value.section)) {
    ctx.addIssue({ code: "custom", path: ["section"], message: "Select the page and area." });
  }
  if (screen?.children?.length && !value.section) {
    ctx.addIssue({ code: "custom", path: ["section"], message: "Select the page and area." });
  }
});
export type TrackerReportInput = z.infer<typeof trackerReportSchema>;
