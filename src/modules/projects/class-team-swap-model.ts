import type { ProjectTeam } from "./class-team-split-model";

/** Swap two existing learners while preserving exact team sizes and immutable preview state. */
export function swapClassTeamMembers(groups: readonly ProjectTeam[], leftId: string, rightId: string): ProjectTeam[] {
  const result=groups.map(group=>({name:group.name,membershipIds:[...group.membershipIds]}));
  const find=(id:string)=>result.flatMap((g,i)=>g.membershipIds.map((value,j)=>value===id?{group:i,index:j}:null)).filter((x):x is {group:number;index:number}=>x!==null);
  const a=find(leftId),b=find(rightId);
  if(leftId===rightId||a.length!==1||b.length!==1||a[0].group===b[0].group)throw Error("TEAM_SWAP_INVALID");
  result[a[0].group].membershipIds[a[0].index]=rightId;
  result[b[0].group].membershipIds[b[0].index]=leftId;
  return result;
}