export type ProjectResourceVisibility="TEAM"|"MENTOR_ONLY";
export type ProjectResourceViewer="ADMIN"|"MENTOR"|"LEARNER";
/** Can only be used once the persisted visibility field is registered and loaded. */
export function canViewProjectResource(visibility:ProjectResourceVisibility,viewer:ProjectResourceViewer) {
  return visibility==="TEAM"||viewer==="ADMIN"||viewer==="MENTOR";
}
