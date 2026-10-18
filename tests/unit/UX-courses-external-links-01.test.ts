import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(new URL("../../src/components/courses/"+p+".tsx",import.meta.url),"utf8");

describe("UX-courses-external-links-01 safe learner and offering external content",()=>{
 for(const component of ["admin-offering-learning-overview","learner-youtube-player"]){
  it(`${component} protects every rendered new-tab content link from opener access`,()=>{
   const src=read(component);
   expect(src).toContain('target="_blank"');
   expect(src).toContain('rel="noopener noreferrer"');
   const matches=[...src.matchAll(/target="_blank"/g)];
   for(const match of matches){
    const around=src.slice(Math.max(0,match.index-150),match.index+175);
    expect(around).toContain('rel="noopener noreferrer"');
   }
  });
 }
});
