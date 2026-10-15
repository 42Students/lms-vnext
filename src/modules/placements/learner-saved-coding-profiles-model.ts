import type {LearnerProfileDocument} from "@/modules/people/profile-validation";
import {learnerCodingProfileLink} from "./learner-coding-profile-link";

const PLATFORMS=[
  {platform:"GITHUB",label:"GitHub",key:"github"},
  {platform:"LEETCODE",label:"LeetCode",key:"leetcode"},
  {platform:"CODECHEF",label:"CodeChef",key:"codechef"},
  {platform:"CODEFORCES",label:"Codeforces",key:"codeforces"},
  {platform:"HACKERRANK",label:"HackerRank",key:"hackerrank"},
] as const;

/** Only saved user-authored URL metadata is considered; never query external profiles. */
export function learnerSavedCodingProfiles(document:LearnerProfileDocument){
  return PLATFORMS.flatMap(({platform,label,key})=>{
    // An earlier malformed duplicate must not hide a later valid saved URL.
    // Each candidate is independently checked against the exact platform host.
    const candidates=platform==="GITHUB" ? [document.socialProfiles.githubUrl]
      : document.metadata.filter(entry=>entry.type==="url" &&
        entry.key.trim().toLowerCase()===key).map(entry=>entry.value);
    const href=candidates.map(value=>learnerCodingProfileLink(platform,value))
      .find((value):value is string=>value!==null)??null;
    return href?[{platform,label,href}]:[];
  });
}
