import type { ProjectTeam } from "./class-team-split-model";
function safeCsv(value:string):string{const safe=/^[\t\r\n ]*[=+@-]/.test(value)?"'"+value:value;return '"'+safe.replace(/"/g,'""')+'"';}
export function exportClassTeamsCsv(teams:readonly ProjectTeam[],rolls:ReadonlyMap<string,string>):string{const rows=["Team,Membership ID,Roll number"];for(const team of teams){for(const id of team.membershipIds){rows.push([team.name,id,rolls.get(id)??""].map(safeCsv).join(","));}}return rows.join("\r\n")+"\r\n";}
