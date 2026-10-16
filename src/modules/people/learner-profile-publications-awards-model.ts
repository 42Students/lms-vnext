import type {LearnerProfileDocument} from "./profile-validation";

export type LearnerShowcaseKind = "award" | "publication";
export type LearnerShowcaseDetails = {
  title: string;
  organization: string;
  date: string;
  url: string;
  description: string;
};
const AWARD_KEY = "Profile award";
const PUBLICATION_KEY = "Profile publication";
const legacyPublicationKey = /^(publication|publications|research publication|research publications)$/i;
type MetadataEntry = LearnerProfileDocument["metadata"][number];

export function isLearnerShowcaseKey(key: string) {
  const trimmed = key.trim();
  return trimmed === AWARD_KEY || trimmed === PUBLICATION_KEY ||
    legacyPublicationKey.test(trimmed);
}

export function newLearnerShowcaseEntry(
  id: string, kind: LearnerShowcaseKind, details: LearnerShowcaseDetails,
): MetadataEntry {
  return {
    id,
    key: kind === "award" ? AWARD_KEY : PUBLICATION_KEY,
    type: "long_text",
    value: JSON.stringify(details),
  };
}

function readDetails(entry: MetadataEntry): LearnerShowcaseDetails {
  const blank = {title: "", organization: "", date: "", url: "", description: ""};
  if (entry.key !== AWARD_KEY && entry.key !== PUBLICATION_KEY)
    return {...blank, title: entry.value};
  try {
    const data: unknown = JSON.parse(entry.value);
    if (!data || typeof data !== "object" || Array.isArray(data)) return {...blank, title: entry.value};
    const fields = data as Record<string, unknown>;
    return {
      title: typeof fields.title === "string" ? fields.title : "",
      organization: typeof fields.organization === "string" ? fields.organization : "",
      date: typeof fields.date === "string" ? fields.date : "",
      url: typeof fields.url === "string" ? fields.url : "",
      description: typeof fields.description === "string" ? fields.description : "",
    };
  } catch {
    return {...blank, title: entry.value};
  }
}

/** Awards and publications are learner-authored, not college-certified achievements. */
export function learnerProfilePublicationsAwards(
  document: Pick<LearnerProfileDocument, "achievements" | "metadata">,
) {
  const records = document.metadata.filter(item=>isLearnerShowcaseKey(item.key) && item.value.trim());
  return {
    awards: records.filter(item=>item.key === AWARD_KEY).map(item=>({
      id: item.id, ...readDetails(item),
    })),
    publications: records.filter(item=>item.key === PUBLICATION_KEY ||
      legacyPublicationKey.test(item.key.trim())).map(item=>({
      id: item.id, ...readDetails(item),
    })),
  };
}

/** Keep the prior metadata import shape readable to older profile records. */
export function newLearnerPublicationEntry(id: string) {
  return {id, key: "Publication", type: "long_text" as const, value: ""};
}
