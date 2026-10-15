import {describe,it,expect} from "vitest";
import {parseCollegeContactsSearchParams} from "@/modules/people/college-contacts-model";
describe("Contact filters do not silently drop dangerous object keys",()=>{
 it("rejects an own __proto__ filter instead of mutating the parser object",()=>{const raw=Object.fromEntries([["__proto__","forged"],["tab","STUDENT"]]);expect(()=>parseCollegeContactsSearchParams(raw)).toThrow();});
 it("rejects unknown scope and ambiguous duplicates",()=>{expect(()=>parseCollegeContactsSearchParams({collegeId:"forged"})).toThrow();expect(()=>parseCollegeContactsSearchParams({tab:["STUDENT","FACULTY"]})).toThrow();});
 it("still accepts ordinary valid filters",()=>{expect(parseCollegeContactsSearchParams({tab:"STUDENT"}).tab).toBe("STUDENT");});
});
