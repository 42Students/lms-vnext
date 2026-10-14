/**
 * Pure presentation model for the Super Admin settings inventory.
 * Only explicitly selected non-secret numeric and boolean values
 * may be placed in the inventory.
 */

export type PlatformSettingValue = number | boolean;

export type PlatformSettingOrigin =
  | "FIXED_SOURCE"
  | "COLLEGE_FALLBACK"
  | "COLLEGE_PERSISTED";

export type PlatformSettingScope =
  | "PLATFORM"
  | "PER_COLLEGE";

export type PlatformSettingItem = {
  label: string;
  value: PlatformSettingValue;
  unit?: string;
  source: string;
  origin: PlatformSettingOrigin;
  scope: PlatformSettingScope;
};

export type PlatformSmsTemplate = {
  key: string;
  purpose: string;
  channels: readonly string[];
  definition: "FIXED_OTP_SOURCE" | "OUTBOUND_INTENT_ONLY";
  source: string;
};

/**
 * Present source-authored, non-secret identifiers only. These rows are not
 * DLT sender IDs, provider template IDs, message bodies, credentials or
 * evidence of an operational outbound dispatcher.
 *
 * The invitation keys and channel vocabulary are supplied by the shared
 * outbound contract rather than independently redefined.
 */
export function buildPlatformSmsTemplateCatalog(input: {
  outboundTemplateKeys: readonly string[];
  outboundChannels: readonly string[];
}): PlatformSmsTemplate[] {
  return [
    {
      key: "OTP",
      purpose: "One-time login verification via the Exotel SMS provider.",
      channels: ["SMS"],
      definition: "FIXED_OTP_SOURCE",
      source: "src/modules/notifications/exotel-sms.ts",
    },
    ...input.outboundTemplateKeys.map((key) => ({
      key,
      purpose:
        key === "RECRUITER_INVITATION"
          ? "Recruiter invitation intent; no active queued sender is established."
          : key === "RECRUITER_INVITATION_REMINDER"
            ? "Recruiter invitation reminder intent; no active queued sender is established."
            : "Outbound message intent only; purpose not classified.",
      channels: [...input.outboundChannels],
      definition: "OUTBOUND_INTENT_ONLY" as const,
      source: "src/modules/operations/outbound-delivery-contract.ts",
    })),
  ];
}

export type PlatformSettingsSection = {
  id:
    | "course-progress"
    | "attendance"
    | "placements"
    | "sms"
    | "operations";
  title: string;
  description: string;
  items: PlatformSettingItem[];
  note?: string;
  smsTemplates?: PlatformSmsTemplate[];
};

export function fixedPlatformSetting(
  label: string,
  value: PlatformSettingValue,
  source: string,
  unit?: string,
): PlatformSettingItem {
  return {
    label,
    value,
    source,
    unit,
    origin: "FIXED_SOURCE",
    scope: "PLATFORM",
  };
}

/**
 * A missing persisted row must use the existing source default.
 * `false` and zero are valid persisted values, not missing values.
 *
 * When no college is selected, the source fallback is informational:
 * it cannot be described as the effective value for every college.
 */
export function collegePlatformSetting(input: {
  label: string;
  defaultValue: PlatformSettingValue;
  persistedValue: PlatformSettingValue | null;
  collegeSelected: boolean;
  defaultSource: string;
  persistedTable: string;
  unit?: string;
}): PlatformSettingItem {
  const persisted =
    input.collegeSelected &&
    input.persistedValue !== null;

  return {
    label: input.label,
    value: persisted
      ? input.persistedValue!
      : input.defaultValue,
    unit: input.unit,
    source: persisted
      ? input.persistedTable
      : input.defaultSource,
    origin: persisted
      ? "COLLEGE_PERSISTED"
      : "COLLEGE_FALLBACK",
    scope: "PER_COLLEGE",
  };
}

export function formatPlatformSettingValue(
  setting: Pick<
    PlatformSettingItem,
    "value" | "unit"
  >,
): string {
  if (typeof setting.value === "boolean") {
    return setting.value ? "Enabled" : "Disabled";
  }

  const number = new Intl.NumberFormat("en-IN").format(
    setting.value,
  );

  if (setting.unit === "%") {
    return `${number}%`;
  }

  return setting.unit
    ? `${number} ${setting.unit}`
    : number;
}

export function platformSettingOriginLabel(
  origin: PlatformSettingOrigin,
): string {
  switch (origin) {
    case "FIXED_SOURCE":
      return "Fixed source value";
    case "COLLEGE_FALLBACK":
      return "Per-college source default";
    case "COLLEGE_PERSISTED":
      return "Per-college persisted value";
  }
}
