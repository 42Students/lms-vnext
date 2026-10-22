import type { ProjectTeam } from "./class-team-split-model";

/** Swap two existing learners while preserving exact team sizes and immutable preview state. */
export function swapClassTeamMembers(groups: readonly ProjectTeam[], leftId: string, rightId: string): ProjectTeam[] {
  const result=groups.map(group=>({name:group.name,membershipIds:[...group.membershipIds]}));
  const find=(id:string)=>result.flatMap((g,i)=>g.membershipIds.map((value,j)=>value===id?{group:i,index:j}:null)).filter((x):x is {group:number;index:number}=>x!==null);
  const a=find(leftId),b=find(rightId);
  const left=a[0],right=b[0];
  if(leftId===rightId||a.length!==1||b.length!==1||!left||!right||left.group===right.group)throw Error("TEAM_SWAP_INVALID");
  const leftGroup=result[left.group],rightGroup=result[right.group];
  if(!leftGroup||!rightGroup||leftGroup.membershipIds[left.index]!==leftId||
     rightGroup.membershipIds[right.index]!==rightId)throw Error("TEAM_SWAP_INVALID");
  leftGroup.membershipIds[left.index]=rightId;
  rightGroup.membershipIds[right.index]=leftId;
  return result;
}