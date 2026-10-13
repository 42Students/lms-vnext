import {
  tpoSettingOrigin,
  type TpoSettingOrigin,
} from "./tpo-settings-model";

export type TpoCompanyVisibilityInput = {
  showCgpaExact: boolean;
  showTenthTwelfth: boolean;
  showProjectLinks: boolean;
  showAssessmentScores: boolean;
  showAttendance: boolean;
  updatedAt: Date | null;
};

type VisibilityKey = Exclude<
  keyof TpoCompanyVisibilityInput,
  "updatedAt"
>;

export type TpoCompanyVisibilityField = {
  key: VisibilityKey;
  label: string;
  enabled: boolean;
  explanation: string;
  source: TpoSettingOrigin;
};

type VisibilityDefinition = {
  key: VisibilityKey;
  label: string;
  enabledExplanation: string;
  disabledExplanation: string;
};

/**
 * All five sharing flags currently persisted in
 * placement_company_visibility_settings.
 *
 * These descriptions explain policy intent, not proof
 * that every recruiter-facing consumer enforces it.
 */
const VISIBILITY_DEFINITIONS = [
  {
    key: "showCgpaExact",
    label: "Exact CGPA",
    enabledExplanation:
      "The college permits a recruiter-facing view to include a learner's exact CGPA when that information is available.",
    disabledExplanation:
      "The college's sharing policy does not permit disclosure of a learner's exact CGPA.",
  },
  {
    key: "showTenthTwelfth",
    label: "Class 10 and Class 12 percentages",
    enabledExplanation:
      "The college permits recruiter-facing views to include recorded Class 10 and Class 12 percentages when available.",
    disabledExplanation:
      "The college's sharing policy does not permit disclosure of Class 10 or Class 12 percentages.",
  },
  {
    key: "showProjectLinks",
    label: "Project links",
    enabledExplanation:
      "The college permits recruiter-facing views to include available links to a learner's projects.",
    disabledExplanation:
      "The college's sharing policy does not permit disclosure of learner project links.",
  },
  {
    key: "showAssessmentScores",
    label: "Assessment scores",
    enabledExplanation:
      "The college permits recruiter-facing views to include available learner assessment scores.",
    disabledExplanation:
      "The college's sharing policy does not permit disclosure of learner assessment scores.",
  },
  {
    key: "showAttendance",
    label: "Attendance",
    enabledExplanation:
      "The college permits recruiter-facing views to include available learner attendance information.",
    disabledExplanation:
      "The college's sharing policy does not permit disclosure of learner attendance information.",
  },
] as const satisfies readonly VisibilityDefinition[];

export function describeTpoCompanyVisibility(
  visibility: TpoCompanyVisibilityInput,
): {
  source: TpoSettingOrigin;
  fields: TpoCompanyVisibilityField[];
  enabledCount: number;
  disabledCount: number;
} {
  const source = tpoSettingOrigin(
    visibility.updatedAt,
  );

  const fields: TpoCompanyVisibilityField[] =
    VISIBILITY_DEFINITIONS.map((definition) => {
      const enabled = visibility[definition.key];

      return {
        key: definition.key,
        label: definition.label,
        enabled,
        explanation: enabled
          ? definition.enabledExplanation
          : definition.disabledExplanation,
        source,
      };
    });

  const enabledCount = fields.filter(
    (field) => field.enabled,
  ).length;

  return {
    source,
    fields,
    enabledCount,
    disabledCount: fields.length - enabledCount,
  };
}
