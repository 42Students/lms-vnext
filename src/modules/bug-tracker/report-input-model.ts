import { z } from "zod";
import { BUG_ACCOUNT_ROLES, BUG_ENVIRONMENTS, BUG_SEVERITIES } from "./admin-validation";
import { ISSUE_TYPE_OPTIONS, LOCATION_OPTIONS, REPORTER_OPTIONS } from "./report-form-options";

/** SA-placements-projects-100: exact legacy report intake; server revalidates all fields. */
export const trackerReportSchema = z.object({
  reporterName: z.string().trim().min(1, "Select your name.").max(120)
    .refine(value => REPORTER_OPTIONS.some(option => option.value === value), "Select your name."),
  accountRole: z.enum(BUG_ACCOUNT_ROLES, { error: "Select the account you were testing." }),
  environment: z.enum(BUG_ENVIRONMENTS, { error: "Select where you saw the issue." }),
  page: z.string().trim().min(1, "Select the page and area.").max(120),
  screen: z.string().trim().max(120).nullable().optional(),
  section: z.string().trim().max(120).nullable().optional(),
  issueType: z.string().trim().min(1, "Select the closest issue type.").max(80)
    .refine(value => ISSUE_TYPE_OPTIONS.some(option => option.value === value), "Select the closest issue type."),
  severity: z.enum(BUG_SEVERITIES),
  description: z.string().trim().min(1, "Describe what went wrong.")
    .max(4000, "Keep the description under 4000 characters."),
  evidenceLink: z.union([z.url({ protocol: /^https?$/ }).max(1000), z.literal(""), z.null()]).optional(),
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
  sourcePath: z.string().trim().max(500).nullable().optional(),
  browser: z.string().trim().max(500).nullable().optional(),
  viewport: z.string().trim().max(64).nullable().optional(),
}).strict().superRefine((value, ctx) => {
  const page = LOCATION_OPTIONS.find(option => option.value === value.page);
  if (!page) {
    ctx.addIssue({ code: "custom", path: ["page"], message: "Select the page and area." });
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
