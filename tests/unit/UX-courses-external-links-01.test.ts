import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../src/components/courses/"+p+".tsx",import.meta.url),"utf8");

describe("UX-courses-external-links-01 safe learner and offering external content",()=>{
 for(const component of ["admin-offering-learning-overview","learner-youtube-player"]){
  it(`${component} opens external media in the same tab and never grants opener access`,()=>{
   const src=read(component);
   expect(src).toContain('rel="noopener noreferrer"');
   expect(src).not.toContain('target="_blank"');
   expect(src).toContain(component==="learner-youtube-player"?'href={videoUrl}':'href={item.externalUrl}');
   expect(src).toContain("min-h-11");
  });
 }
});
