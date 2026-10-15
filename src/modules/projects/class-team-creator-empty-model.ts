/** Explain empty dependencies instead of showing a form that can never submit. */
export function classTeamCreatorEmptyMessages(loadingClasses:boolean,classCount:number,templateCount:number){
 return {
  classes:!loadingClasses&&classCount===0
    ?"No active classes are available. Create or activate a class before planning project teams.":null,
  templates:templateCount===0
    ?"No published Project template is assigned to this college. Assign a template before creating workspaces.":null,
 };
}
