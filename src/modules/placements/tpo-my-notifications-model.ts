import { z } from "zod";

export const TPO_NOTIFICATION_VIEWS = [
  "ALL",
  "UNREAD",
  "READ",
] as const;

export type TpoNotificationView =
  (typeof TPO_NOTIFICATION_VIEWS)[number];

// Reject hexadecimal, scientific notation, signed values and whitespace:
// Number() would otherwise interpret them as valid page numbers.
const decimalPage = (max:number,defaultValue:number) =>
  z.union([
    z.number().int().min(1).max(max),
    z.string().regex(/^[0-9]+$/).transform(Number).pipe(z.number().int().min(1).max(max)),
  ]).default(defaultValue);

export const tpoMyNotificationsQuerySchema = z
  .object({
    view: z.enum(TPO_NOTIFICATION_VIEWS).default("ALL"),
    page: decimalPage(10000,1),
    pageSize: decimalPage(100,25),
  })
  .strict();

export type TpoMyNotificationsQuery = z.infer<
  typeof tpoMyNotificationsQuerySchema
>;

/** Reject repeated/unsupported query keys rather than choosing the first
 * value of a potentially attacker-controlled array. */
export function parseTpoMyNotificationsParams(
  raw:Record<string,string|string[]|undefined>,
):TpoMyNotificationsQuery|null{
  if(Object.keys(raw).some(key=>!["view","page","pageSize"].includes(key)))return null;
  if(Object.values(raw).some(Array.isArray))return null;
  const parsed=tpoMyNotificationsQuerySchema.safeParse({
    view:raw.view||undefined,page:raw.page||undefined,pageSize:raw.pageSize||undefined,
  });
  return parsed.success?parsed.data:null;
}


export type TpoNotificationPreferences = {
  morningDigest: boolean;
  recruiterMessages: boolean;
  requests: boolean;
  resultsReady: boolean;
  followUps: boolean;
};

/**
 * These are the defaults declared on the existing
 * placement_tpo_user_preferences Drizzle columns.
 * They do not establish that a preference row exists.
 */
export const TPO_NOTIFICATION_PREFERENCE_DEFAULTS:
  TpoNotificationPreferences = {
    morningDigest: false,
    recruiterMessages: true,
    requests: true,
    resultsReady: true,
    followUps: true,
  };

export const TPO_NOTIFICATION_PREFERENCE_FIELDS = [
  {
    key: "morningDigest",
    label: "Morning digest",
    description: "Preference for a morning summary.",
  },
  {
    key: "recruiterMessages",
    label: "Recruiter messages",
    description: "Preference for recruiter message updates.",
  },
  {
    key: "requests",
    label: "Placement requests",
    description: "Preference for placement request updates.",
  },
  {
    key: "resultsReady",
    label: "Results ready",
    description: "Preference for placement-result updates.",
  },
  {
    key: "followUps",
    label: "Follow-ups",
    description: "Preference for recruiter follow-up updates.",
  },
] as const satisfies readonly {
  key: keyof TpoNotificationPreferences;
  label: string;
  description: string;
}[];

export function resolveTpoNotificationPreferences(
  tableAvailable: boolean,
  persisted: TpoNotificationPreferences | null,
) {
  if (!tableAvailable) {
    return {
      source: "UNAVAILABLE" as const,
      values: null,
    };
  }

  if (!persisted) {
    return {
      source: "SOURCE_DEFAULT" as const,
      values: { ...TPO_NOTIFICATION_PREFERENCE_DEFAULTS },
    };
  }

  return {
    source: "PERSISTED" as const,
    values: { ...persisted },
  };
}

/**
 * Use only fixed labels determined by the database module enum.
 *
 * Never render a stored notification title, body, subject label,
 * event type, free-text summary or activity metadata here.
 * Any of those fields can contain personal information.
 */
export function safeTpoNotificationLabel(
  module: string,
): string {
  switch (module) {
    case "PLACEMENTS":
      return "Placement update";
    case "ACADEMICS":
      return "Academic update";
    case "COURSES":
      return "Course update";
    case "PROJECTS":
      return "Project update";
    case "IDENTITY":
      return "Account update";
    case "PLATFORM":
      return "Platform update";
    default:
      return "College notification";
  }
}

export function tpoNotificationReadStatus(
  readAt: Date | null,
): "READ" | "UNREAD" {
  return readAt === null ? "UNREAD" : "READ";
}

export function tpoMyNotificationsHref(
  input: Partial<TpoMyNotificationsQuery>,
): string {
  const params = new URLSearchParams();

  if (input.view && input.view !== "ALL") {
    params.set("view", input.view);
  }

  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }

  if (input.pageSize && input.pageSize !== 25) {
    params.set("pageSize", String(input.pageSize));
  }

  const query = params.toString();

  return query
    ? `/tpo/settings/notifications?${query}`
    : "/tpo/settings/notifications";
}
