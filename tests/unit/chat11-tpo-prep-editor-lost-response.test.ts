import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
import {getTpoPrepSelectionState} from "@/modules/placements/tpo-prep-selection-model";

const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const saved={courseIds:[a],minimumCompleted:1};

describe("TPO-settings-audit-PREP-UI-03 preparation setting editor correctness",()=>{
 it("makes an identical saved policy non-dirty and rejects invalid numeric or duplicate choices",()=>{
  expect(getTpoPrepSelectionState([a],saved,1,[a,b])).toEqual({missing:[],dirty:false,valid:true});
  expect(getTpoPrepSelectionState([a,b],saved,2,[a,b])).toEqual({missing:[],dirty:true,valid:true});
  for(const minimum of [-1,1.5,3,Number.NaN,Infinity])
   expect(getTpoPrepSelectionState([a,b],saved,minimum,[a,b]).valid).toBe(false);
  expect(getTpoPrepSelectionState([a,a],saved,1,[a,b]).valid).toBe(false);
  expect(getTpoPrepSelectionState(Array(41).fill(a),saved,1,[a,b]).valid).toBe(false);
 });
 it("does not silently discard a configured course removed from the college catalog",()=>{
  expect(getTpoPrepSelectionState([a,b],saved,1,[a])).toEqual({
   missing:[b],dirty:true,valid:false,
  });
  expect(getTpoPrepSelectionState([a,b],saved,1,[]).missing).toEqual([a,b]);
  expect(getTpoPrepSelectionState([a],saved,1,[a])).toMatchObject({valid:true,dirty:false});
 });
 it("maintains a synchronous in-flight latch, new returned version and safe conflict without losing edits",()=>{
  const source=readFileSync("src/components/tpo/tpo-prep-readiness-editor.tsx","utf8");
  const service=readFileSync("src/modules/placements/tpo-prep-readiness-write-service.ts","utf8");
  expect(source).toContain("const submitting=useRef(false)");
  expect(source).toContain("if(submitting.current||!dirty||!valid)return");
  expect(source).toContain("submitting.current=true");
  expect(source).toContain("finally{submitting.current=false;setBusy(false);}");
  expect(source).toContain("getTpoPrepSelectionState(");
  expect(source).toContain("expectedVersion:version");
  expect(source).toContain("setVersion(result.updatedAt)");
  expect(source).toContain("setSaved({courseIds:[...selected],minimumCompleted:minimum})");
  expect(source).toContain("Remove unavailable courses");
  expect(source).toContain("if(e instanceof FriendlyFetchError");
  expect(source).not.toContain('setError(e instanceof Error?e.message');
  expect(service).toContain("tpoPrepReadinessSamePolicy(current.config,input)");
  expect(service).toContain("assertPersistedPlatformPermission(tx,context");
 });
});
