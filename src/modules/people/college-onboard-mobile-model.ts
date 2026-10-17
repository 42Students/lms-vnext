/** India-local faculty/student onboarding accepts the legacy ten-digit login mobile.
 * Global non-Indian onboarding keeps the existing strict E.164 identity path. */
export function indianMobileToE164(raw:string):string|null{
 const value=raw.trim().replace(/[\s()-]/g,"");
 if(/^\d{10}$/.test(value))return "+91"+value;
 if(/^\+91\d{10}$/.test(value))return value;
 return null;
}
export function legacyPersonName(first:string,last:string):string {
 return [first.trim(),last.trim()].filter(Boolean).join(" ");
}
