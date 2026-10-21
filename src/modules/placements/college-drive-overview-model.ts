export function displayDriveMetric(value: number | null) {
  return value === null ? "Not available" : value.toLocaleString("en-IN");
}
/** Only the selected stage has no authoritative source; comparable missing counts
 * retain the old LMS's zero fallback without disguising absent selection data. */
export function displayDriveMetricByStage(
 name:"applications"|"shortlisted"|"selected"|"offered",
 value:number|null|undefined,
):string {
 if(name==="selected")return value==null?"Not available":displayDriveMetric(value);
 return displayDriveMetric(value??0);
}
export function describeDriveMetric(name: "applications" | "shortlisted" | "selected" | "offered") {
  const descriptions = {
    applications: "Persisted application records, including withdrawn",
    shortlisted: "Currently submitted applications with SHORTLISTED screening",
    selected: "No authoritative selected outcome exists in the registered source",
    offered: "Distinct applications with one or more issued offer records",
  };
  return descriptions[name];
}
