/** Client-safe, already-college-scoped debarment view. */
export type TpoTimedDebarRow={
 id:string;reason:string;untilDate:string|null;untilDrives:number|null;
 drivesCounted:number;createdAt:string;liftedAt:string|null;liftedReason:string|null;
 active:boolean;
};

/** Match the placement API's India-local calendar dates, regardless of browser time zone. */
export function todayInIndia(now: Date = new Date()): string {
 const parts = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata", day: "2-digit", month: "2-digit", year: "numeric",
 }).formatToParts(now);
 const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? "";
 return [part("year"), part("month"), part("day")].join("-");
}

export type DebarDuration = "DATE" | "DRIVES" | "MANUAL";

/** Client validation complements (never replaces) the scoped server authorization. */
export function timedDebarDraftError(input: {
 reason: string; duration: DebarDuration; untilDate: string;
 untilDrives: string; today: string;
}): string | null {
 const reason = input.reason.trim();
 if (!reason) return "Enter a reason before reviewing this debarment.";
 if (reason.length > 500) return "Keep the reason within 500 characters.";
 if (input.duration === "DATE" &&
     (!/^\d{4}-\d{2}-\d{2}$/.test(input.untilDate) || input.untilDate < input.today)) {
  return "Choose today or a future date in India time.";
 }
 if (input.duration === "DRIVES" &&
     (!/^\d+$/.test(input.untilDrives.trim()) ||
      !Number.isSafeInteger(Number(input.untilDrives)) ||
      Number(input.untilDrives) < 1 || Number(input.untilDrives) > 10000)) {
  return "Enter a whole number of drives between 1 and 10,000.";
 }
 return null;
}
