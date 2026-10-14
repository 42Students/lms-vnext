import { describe, expect, it } from "vitest";
import {
  buildPlatformSmsTemplateCatalog,
  collegePlatformSetting,
  fixedPlatformSetting,
  formatPlatformSettingValue,
  platformSettingOriginLabel,
} from "@/modules/platform-settings/model";

describe("Platform settings presentation model", () => {
  const sources = {
    defaultSource: "src/modules/example/policy.ts",
    persistedTable: "example_college_policy",
  };

  it("labels fixed source values without implying persistence", () => {
    expect(
      fixedPlatformSetting(
        "Completion threshold",
        90,
        "src/modules/courses/progress-service.ts",
        "%",
      ),
    ).toEqual({
      label: "Completion threshold",
      value: 90,
      unit: "%",
      source:
        "src/modules/courses/progress-service.ts",
      origin: "FIXED_SOURCE",
      scope: "PLATFORM",
    });
  });

  it("uses source defaults when no college is selected", () => {
    const result = collegePlatformSetting({
      label: "Threshold",
      defaultValue: 75,
      persistedValue: 82,
      collegeSelected: false,
      ...sources,
      unit: "%",
    });

    expect(result).toMatchObject({
      value: 75,
      origin: "COLLEGE_FALLBACK",
      scope: "PER_COLLEGE",
      source: sources.defaultSource,
    });
  });

  it("uses source defaults when a selected college has no policy row", () => {
    const result = collegePlatformSetting({
      label: "Threshold",
      defaultValue: 75,
      persistedValue: null,
      collegeSelected: true,
      ...sources,
      unit: "%",
    });

    expect(result.value).toBe(75);
    expect(result.origin).toBe(
      "COLLEGE_FALLBACK",
    );
  });

  it("labels persisted college overrides and their actual table", () => {
    const result = collegePlatformSetting({
      label: "Threshold",
      defaultValue: 75,
      persistedValue: 82,
      collegeSelected: true,
      ...sources,
      unit: "%",
    });

    expect(result).toMatchObject({
      value: 82,
      origin: "COLLEGE_PERSISTED",
      source: sources.persistedTable,
      scope: "PER_COLLEGE",
    });
  });

  it("does not mistake false for a missing persisted boolean", () => {
    const result = collegePlatformSetting({
      label: "Show attendance",
      defaultValue: true,
      persistedValue: false,
      collegeSelected: true,
      ...sources,
    });

    expect(result.value).toBe(false);
    expect(result.origin).toBe(
      "COLLEGE_PERSISTED",
    );
    expect(
      formatPlatformSettingValue(result),
    ).toBe("Disabled");
  });

  it("does not mistake zero for a missing persisted number", () => {
    const result = collegePlatformSetting({
      label: "Package uplift",
      defaultValue: 40,
      persistedValue: 0,
      collegeSelected: true,
      ...sources,
      unit: "%",
    });

    expect(result.value).toBe(0);
    expect(result.origin).toBe(
      "COLLEGE_PERSISTED",
    );
    expect(
      formatPlatformSettingValue(result),
    ).toBe("0%");
  });

  it("formats numbers, percentages, durations and booleans", () => {
    expect(
      formatPlatformSettingValue({
        value: 10000,
        unit: "characters",
      }),
    ).toBe("10,000 characters");

    expect(
      formatPlatformSettingValue({
        value: 24,
        unit: "hours",
      }),
    ).toBe("24 hours");

    expect(
      formatPlatformSettingValue({
        value: 75,
        unit: "%",
      }),
    ).toBe("75%");

    expect(
      formatPlatformSettingValue({
        value: true,
      }),
    ).toBe("Enabled");
  });

  it("lists only source-authored template labels and purpose, not provider configuration", () => {
    const templates = buildPlatformSmsTemplateCatalog({
      outboundTemplateKeys: [
        "RECRUITER_INVITATION",
        "RECRUITER_INVITATION_REMINDER",
      ],
      outboundChannels: ["EMAIL", "SMS", "WHATSAPP"],
    });

    expect(templates.map((template) => template.key)).toEqual([
      "OTP",
      "RECRUITER_INVITATION",
      "RECRUITER_INVITATION_REMINDER",
    ]);
    expect(templates[0]).toMatchObject({
      channels: ["SMS"],
      definition: "FIXED_OTP_SOURCE",
    });
    expect(templates[1]).toMatchObject({
      channels: ["EMAIL", "SMS", "WHATSAPP"],
      definition: "OUTBOUND_INTENT_ONLY",
    });
    expect(templates[2].purpose).toContain("reminder");

    const serialized = JSON.stringify(templates);
    expect(serialized).not.toContain("apiKey");
    expect(serialized).not.toContain("accountSid");
    expect(serialized).not.toContain("dltTemplateId");
    expect(serialized).not.toContain("senderId");
    expect(serialized).not.toContain("recipient");
  });

  it("preserves contract-provided channels instead of claiming all templates are live SMS", () => {
    const result = buildPlatformSmsTemplateCatalog({
      outboundTemplateKeys: ["RECRUITER_INVITATION"],
      outboundChannels: ["EMAIL", "SMS"],
    });
    expect(result[1].channels).toEqual(["EMAIL", "SMS"]);
    expect(result[1].definition).toBe("OUTBOUND_INTENT_ONLY");
  });

  it("distinguishes all three origins", () => {
    expect(
      platformSettingOriginLabel("FIXED_SOURCE"),
    ).toBe("Fixed source value");

    expect(
      platformSettingOriginLabel(
        "COLLEGE_FALLBACK",
      ),
    ).toBe("Per-college source default");

    expect(
      platformSettingOriginLabel(
        "COLLEGE_PERSISTED",
      ),
    ).toBe("Per-college persisted value");
  });
});
