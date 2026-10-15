import {z} from "zod";
export const CODING_PROFILE_HOSTS={GITHUB:"github.com",LEETCODE:"leetcode.com",CODECHEF:"codechef.com",CODEFORCES:"codeforces.com",HACKERRANK:"hackerrank.com"} as const;
export const codingProfilePlatformSchema=z.enum(["GITHUB","LEETCODE","CODECHEF","CODEFORCES","HACKERRANK"]);
export function normalizeCodingProfile(platform:keyof typeof CODING_PROFILE_HOSTS,raw:string){
 try{const url=new URL(raw);if(url.protocol!=="https:"||url.username||url.password||url.port||url.hostname.toLowerCase()!==CODING_PROFILE_HOSTS[platform]||url.pathname==="/"||url.pathname.length>240)return null;
 return url.origin+url.pathname.replace(/\/$/,"");}catch{return null;}
}
