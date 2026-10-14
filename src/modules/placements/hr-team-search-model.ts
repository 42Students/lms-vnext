import {z} from "zod";
export const hrTeamSearchSchema=z.string().trim().max(120).default("");
export function searchHrTeam<T extends {displayName:string|null;title:string|null;email:string|null}>(
 team:readonly T[],query:string
):T[] {
 const term=query.trim().toLocaleLowerCase();
 if(!term)return [...team];
 return team.filter(person=>(person.displayName??"").toLocaleLowerCase().includes(term)||
  (person.title??"").toLocaleLowerCase().includes(term)||
  (person.email??"").toLocaleLowerCase().includes(term));
}
