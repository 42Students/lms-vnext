/** Keep team-group plans stable while a roster load or create mutation is active. */
export function canEditClassTeamPlanner(pending:boolean,rosterLoading:boolean):boolean{
 return !pending&&!rosterLoading;
}
