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
    const raw=platform==="GITHUB" ? document.socialProfiles.githubUrl
      : document.metadata.find(entry=>entry.type==="url" &&
        entry.key.trim().toLowerCase()===key)?.value;
    const href=learnerCodingProfileLink(platform,raw);
    return href?[{platform,label,href}]:[];
  });
}
