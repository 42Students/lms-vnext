import type {ProjectTeam} from "./class-team-split-model";

/** All team names and roll labels are untrusted spreadsheet text.
 * Defuse formulas even behind Unicode format/control/spacing characters.
 */
function safeCsv(value:string):string{
 const formula=/^[\p{Cc}\p{Cf}\p{M}\p{Zs}\p{Zl}\p{Zp}]*[=+@-]/u.test(value);
 const safe=formula?"'"+value:value;
 return '"'+safe.replaceAll('"','""')+'"';
}

/** An export contains only teams supplied by the authorized caller. */
export function exportClassTeamsCsv(
 teams:readonly ProjectTeam[],rolls:ReadonlyMap<string,string>,
):string{
 const rows=["Team,Membership ID,Roll number"];
 for(const team of teams){
  for(const id of team.membershipIds){
   rows.push([team.name,id,rolls.get(id)??""].map(safeCsv).join(","));
  }
 }
 return rows.join("\r\n")+"\r\n";
}
