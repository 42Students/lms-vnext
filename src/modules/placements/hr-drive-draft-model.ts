import { z } from "zod";

export const hrDriveDraftQuerySchema = z.strictObject({
  collegeId: z.string().uuid().optional(),
  from: z.string().uuid().optional(),
  fix: z.string().uuid().optional(),
}).refine((input) => !(input.from && input.fix), {
  message: "Choose either Hire Again or Fix and Resend",
});

const round = z.strictObject({
  kind: z.enum(["TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW"]),
  name: z.string().trim().min(2).max(120),
});
export const hrDriveDraftSchema = z.strictObject({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(20).max(5000),
  location: z.string().trim().min(2).max(180),
  employmentType: z.enum(["FULL_TIME", "INTERNSHIP", "CONTRACT"]),
  workMode: z.enum(["ONSITE", "HYBRID", "REMOTE", "NO_PREFERENCE"]),
  minimumAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  maximumAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  minimumCgpa: z.string().regex(/^(?:|(?:10(?:\.0{1,2})?|[0-9](?:\.[0-9]{1,2})?))$/),
  fixedAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  variableAnnualCtcInr: z.string().regex(/^\d{0,9}$/),
  bondMonths: z.string().regex(/^\d{0,3}$/),
  bondAmountInr: z.string().regex(/^\d{0,9}$/),
  maximumActiveBacklogs: z.string().regex(/^\d{0,2}$/),
  rounds: z.array(round).min(1).max(12),
}).superRefine((data, ctx) => {
  const min = data.minimumAnnualCtcInr ? Number(data.minimumAnnualCtcInr) : null;
  const max = data.maximumAnnualCtcInr ? Number(data.maximumAnnualCtcInr) : null;
  if (data.bondMonths && Number(data.bondMonths) > 120) {
    ctx.addIssue({ code: "custom", path: ["bondMonths"], message: "Bond must not exceed 120 months" });
  }
  const fixed = data.fixedAnnualCtcInr ? Number(data.fixedAnnualCtcInr) : null;
  const variable = data.variableAnnualCtcInr ? Number(data.variableAnnualCtcInr) : null;
  if (fixed !== null && variable !== null) {
    const combined = fixed + variable;
    if (min !== null && combined < min) {
      ctx.addIssue({ code: "custom", path: ["fixedAnnualCtcInr"],
        message: "Fixed plus variable CTC must reach the stated minimum annual CTC" });
    }
    if (max !== null && combined > max) {
      ctx.addIssue({ code: "custom", path: ["variableAnnualCtcInr"],
        message: "Fixed plus variable CTC must not exceed the stated maximum annual CTC" });
    }
  }
  if (min !== null && max !== null && max < min) {
    ctx.addIssue({ code: "custom", path: ["maximumAnnualCtcInr"], message: "Maximum CTC must be at least minimum CTC" });
  }
});
export type HrDriveDraft = z.input<typeof hrDriveDraftSchema>;

export function emptyHrDriveDraft(): HrDriveDraft {
  return {
    title: "", description: "", location: "",
    employmentType: "FULL_TIME", workMode: "ONSITE",
    minimumAnnualCtcInr: "", maximumAnnualCtcInr: "", minimumCgpa: "",
    fixedAnnualCtcInr: "", variableAnnualCtcInr: "", bondMonths: "",
    bondAmountInr: "", maximumActiveBacklogs: "",
    rounds: [{ kind: "INTERVIEW", name: "Interview" }],
  };
}

export function hrDraftFromAuthorizedJob(job: {
  title: string; description: string; locations: readonly string[];
  employmentType: string; workMode: string;
  minimumAnnualCtcInr: number | null; maximumAnnualCtcInr: number | null;
}, rounds: readonly { kind: string; name: string }[]): HrDriveDraft {
  const base = emptyHrDriveDraft();
  const type = z.enum(["FULL_TIME", "INTERNSHIP", "CONTRACT"]).safeParse(job.employmentType);
  const mode = z.enum(["ONSITE", "HYBRID", "REMOTE", "NO_PREFERENCE"]).safeParse(job.workMode);
  const allowedRoundKinds = z.enum(["TALK", "TEST", "VENDOR_TEST", "GD", "INTERVIEW"]);
  const validRounds = rounds.flatMap((item) => {
    const kind = allowedRoundKinds.safeParse(item.kind);
    return kind.success && item.name.trim().length >= 2
      ? [{ kind: kind.data, name: item.name.trim() }] : [];
  });
  return {
    ...base,
    title: job.title,
    description: job.description,
    location: job.locations[0] ?? "",
    employmentType: type.success ? type.data : base.employmentType,
    workMode: mode.success ? mode.data : base.workMode,
    minimumAnnualCtcInr: job.minimumAnnualCtcInr?.toString() ?? "",
    maximumAnnualCtcInr: job.maximumAnnualCtcInr?.toString() ?? "",
    rounds: validRounds.length ? validRounds.slice(0, 12) : base.rounds,
  };
}
