import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("faculty content intentional publish controls",()=>{
it("FAC-courses-21 matches the reviewed contract",()=>{const s=read("src/components/courses/faculty-item-actions.tsx");for(const phrase of ["Publish","Archive"])expect(s).toContain(phrase);});
});
