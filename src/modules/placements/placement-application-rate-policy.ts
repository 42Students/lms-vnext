/** The default is the legacy five applications per 60 seconds.
 * Operators may configure 1–30; missing, malformed and zero are fail-safe. */
export function placementApplicationsPerMinute(env:Record<string,string|undefined>=process.env):number {
 const text=(env["PLACEMENT_APPLICATION_RATE_LIMIT_PER_MINUTE"]??"").trim();
 if(!/^(?:[1-9]|1[0-9]|2[0-9]|30)$/.test(text))return 5;
 return Number(text);
}
