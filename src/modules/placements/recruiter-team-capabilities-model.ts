/** Reflect the persisted verified grant's actual feature capabilities.
 * DRIVES never means unrestricted access to all student applications. */
export function recruiterTeamCapabilityLabels(values:readonly string[]):string[]{
 const labels:Record<string,string>={
  DRIVES:"Hiring drives",INTERVIEWS:"Interview scheduling",
  MESSAGES:"Placement-cell messages",APPLICANT_EXPORT:"Authorized applicant exports",
 };
 return [...new Set(values.filter(v=>Object.hasOwn(labels,v)))].map(value=>labels[value]!);
}
