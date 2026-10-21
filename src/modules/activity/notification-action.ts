/**
 * Notification actions are application-internal navigation only.
 * Database rows may predate current validation, so apply this policy
 * both when accepting a new delivery and when returning stored rows.
 */
export function safeNotificationActionHref(
  value: string | null | undefined,
): string | null {
  if (
    !value ||
    value.length > 1000 ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\x00-\x1f\x7f]/.test(value)
  ) {
    return null;
  }

  try {
    const parsed = new URL(value, "https://lms-vnext.invalid");
    if (parsed.origin !== "https://lms-vnext.invalid") {
      return null;
    }
  } catch {
    return null;
  }

  return value;
}

/** External assessment links are separate from notification actionHref:
 * allow only absolute HTTPS/HTTP URLs and never make them a trusted internal path.
 */
export function safeExternalAssessmentUrl(
  value:string|null|undefined,
):string|null {
  if(!value||value.length>2048||/[\\x00-\\x20\\x7f\\\\]/.test(value))return null;
  try {
    const url=new URL(value);
    if((url.protocol!=="https:"&&url.protocol!=="http:")||
        !url.hostname||url.username||url.password)return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const EXTERNAL_ASSESSMENT_URL_VALIDATION_MESSAGE =
  "Assessment URL must use http or https";
