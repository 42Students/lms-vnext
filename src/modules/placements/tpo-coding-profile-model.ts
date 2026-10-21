import {z} from "zod";

/** Legacy ordering and path prefixes, with GitHub preserved as an additive vNext option. */
export const CODING_PROFILE_OPTIONS=[
 {key:"LEETCODE",label:"LeetCode",host:"leetcode.com",pathPrefix:"/u/",pattern:"[A-Za-z0-9_-]{3,30}",hint:"3-30 letters, digits, _ or -"},
 {key:"HACKERRANK",label:"HackerRank",host:"www.hackerrank.com",pathPrefix:"/profile/",pattern:"[A-Za-z0-9_.-]{3,30}",hint:"3-30 letters, digits, _ . or -"},
 {key:"CODECHEF",label:"CodeChef",host:"www.codechef.com",pathPrefix:"/users/",pattern:"[A-Za-z][A-Za-z0-9_]{2,19}",hint:"starts with a letter, 3-20 letters, digits or _"},
 {key:"CODEFORCES",label:"Codeforces",host:"codeforces.com",pathPrefix:"/profile/",pattern:"[A-Za-z0-9_.-]{3,24}",hint:"3-24 letters, digits, _ . or -"},
 {key:"GFG",label:"GeeksforGeeks",host:"www.geeksforgeeks.org",pathPrefix:"/user/",pattern:"[A-Za-z0-9_.-]{3,40}",hint:"3-40 letters, digits, _ . or -"},
 {key:"HACKEREARTH",label:"HackerEarth",host:"www.hackerearth.com",pathPrefix:"/@",pattern:"[A-Za-z0-9_.-]{3,40}",hint:"3-40 letters, digits, _ . or -"},
 {key:"GITHUB",label:"GitHub",host:"github.com",pathPrefix:"/",pattern:"[A-Za-z0-9][A-Za-z0-9-]{0,38}",hint:"1-39 letters, digits or -"},
] as const;
export type CodingProfilePlatform=typeof CODING_PROFILE_OPTIONS[number]["key"];
export const CODING_PROFILE_HOSTS=Object.fromEntries(
 CODING_PROFILE_OPTIONS.map(p=>[p.key,p.host])
) as Record<CodingProfilePlatform,string>;
export const codingProfilePlatformSchema=z.enum(["LEETCODE","HACKERRANK","CODECHEF","CODEFORCES","GFG","HACKEREARTH","GITHUB"]);
export const codingProfileChoices=CODING_PROFILE_OPTIONS.map(p=>({
 key:p.key,value:p.key,label:p.label,host:p.host,
 urlPrefix:"https://"+p.host+p.pathPrefix,pattern:p.pattern,hint:p.hint,
}));
export function validateCodingProfile(platform:CodingProfilePlatform,raw:string):{url:string|null;error:string|null}{
 const option=CODING_PROFILE_OPTIONS.find(p=>p.key===platform);
 if(!option)return {url:null,error:"Unknown coding platform."};
 const value=raw.trim();
 if(!value)return {url:null,error:null};
 let username=value;
 if(value.includes("/")||value.toLowerCase().includes(option.host.replace(/^www\./,""))){
  let link:URL;
  try{link=new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(value)?value:"https://"+value);}
  catch{return {url:null,error:option.label+": that link is not a "+option.label+" profile. Type your username instead."};}
  const hostname=link.hostname.toLowerCase().replace(/^www\./,"");
  if(!["http:","https:"].includes(link.protocol)||link.username||link.password||link.port||
    hostname!==option.host.replace(/^www\./,"")||!link.pathname.startsWith(option.pathPrefix)){
   return {url:null,error:option.label+": that link is not a "+option.label+" profile. Type your username instead."};
  }
  username=link.pathname.slice(option.pathPrefix.length).replace(/\/+$/,"");
  if(username.includes("/"))return {url:null,error:option.label+": that link is not a "+option.label+" profile. Type your username instead."};
 }
 if(!new RegExp("^"+option.pattern+"$").test(username))
  return {url:null,error:option.label+" username does not look right ("+option.hint+")."};
 return {url:"https://"+option.host+option.pathPrefix+username,error:null};
}
export function normalizeCodingProfile(platform:CodingProfilePlatform,raw:string){
 return validateCodingProfile(platform,raw).url;
}
