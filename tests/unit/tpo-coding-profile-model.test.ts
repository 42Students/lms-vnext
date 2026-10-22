import {it,expect} from "vitest";import {CODING_PROFILE_OPTIONS,codingProfileChoices,normalizeCodingProfile,validateCodingProfile} from "@/modules/placements/tpo-coding-profile-model";
it("rejects masquerading hosts and unsafe schemes",()=>{expect(normalizeCodingProfile("GITHUB","https://github.com/student")).toBe("https://github.com/student");expect(normalizeCodingProfile("GITHUB","https://github.com.evil.test/student")).toBeNull();expect(normalizeCodingProfile("GITHUB","javascript:alert(1)")).toBeNull();});

it("G2-2-030-009/019/021/069 preserves all six legacy coding choices before GitHub",()=>{
 const keys=["LEETCODE","HACKERRANK","CODECHEF","CODEFORCES","GFG","HACKEREARTH"];
 expect(CODING_PROFILE_OPTIONS.slice(0,6).map(p=>p.key)).toEqual(keys);
 expect(CODING_PROFILE_OPTIONS.at(-1)?.key).toBe("GITHUB");
 const prefixes=[
  "https://leetcode.com/u/","https://www.hackerrank.com/profile/",
  "https://www.codechef.com/users/","https://codeforces.com/profile/",
  "https://www.geeksforgeeks.org/user/","https://www.hackerearth.com/@"];
 const patterns=[
  "[A-Za-z0-9_-]{3,30}","[A-Za-z0-9_.-]{3,30}",
  "[A-Za-z][A-Za-z0-9_]{2,19}","[A-Za-z0-9_.-]{3,24}",
  "[A-Za-z0-9_.-]{3,40}","[A-Za-z0-9_.-]{3,40}"];
 expect(codingProfileChoices.slice(0,6).map(p=>p.urlPrefix)).toEqual(prefixes);
 expect(codingProfileChoices.slice(0,6).map(p=>p.pattern)).toEqual(patterns);
 expect(codingProfileChoices.slice(0,6).every(p=>p.hint.length>0&&p.value===p.key)).toBe(true);
 for(let i=0;i<6;i++){
  const platform=keys[i] as (typeof CODING_PROFILE_OPTIONS)[number]["key"];
  const username=i===2?"Asha_09":"asha_99";
  const expected=prefixes[i]+username;
  expect(validateCodingProfile(platform,username)).toEqual({url:expected,error:null});
  expect(validateCodingProfile(platform,expected+"/")).toEqual({url:expected,error:null});
 }
});
it("shows the legacy validation guidance while refusing a spoofed coding profile",()=>{
 expect(validateCodingProfile("LEETCODE","a")).toEqual({
  url:null,error:"LeetCode username should be 3-30 letters, digits, _ or -.",
 });
 expect(validateCodingProfile("LEETCODE","https://leetcode.com.evil.test/u/asha_99")).toEqual({
  url:null,error:"That link is not a LeetCode profile. Type your username instead.",
 });
 expect(validateCodingProfile("HACKEREARTH","https://www.hackerearth.com/@asha_99/")).toEqual({
  url:"https://www.hackerearth.com/@asha_99",error:null,
 });
});
