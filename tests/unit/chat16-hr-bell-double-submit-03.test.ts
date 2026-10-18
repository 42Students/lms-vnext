import {describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import {createHrBellMutationGate} from "@/modules/placements/hr-recruiter-bell-model";

describe("REC-calendar-messages-profile-21 recruiter notification write races",()=>{
 it("rejects same-tick duplicate mark-all requests before UI state can rerender",async()=>{
  const gate=createHrBellMutationGate();
  let resolve!:()=>void;
  const waiting=new Promise<void>(done=>{resolve=done;});
  const post=vi.fn(async()=>waiting);
  async function mark(){
   if(!gate.tryBegin())return false;
   try{await post();return true;}
   finally{gate.end();}
  }
  const first=mark(),duplicate=mark();
  expect(post).toHaveBeenCalledTimes(1);
  resolve();
  expect(await Promise.all([first,duplicate])).toEqual([true,false]);
  expect(await mark()).toBe(true);
  expect(post).toHaveBeenCalledTimes(2);
 });
 it("releases the gate after a failed network request so the user can retry",async()=>{
  const gate=createHrBellMutationGate();
  const post=vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(undefined);
  async function mark(){
   if(!gate.tryBegin())return false;
   try{await post();return true;}
   finally{gate.end();}
  }
  await expect(mark()).rejects.toThrow("offline");
  await expect(mark()).resolves.toBe(true);
  expect(post).toHaveBeenCalledTimes(2);
 });
 it("isolates separate bell instances while retaining a visible loading state",()=>{
  const a=createHrBellMutationGate(),b=createHrBellMutationGate();
  expect(a.tryBegin()).toBe(true);
  expect(a.tryBegin()).toBe(false);
  expect(b.tryBegin()).toBe(true);
  a.end();b.end();
  expect(a.tryBegin()).toBe(true);
  const bell=readFileSync("src/components/hr/hr-recruiter-bell.tsx","utf8");
  expect(bell).toContain("markAllGate.current.tryBegin()");
  expect(bell).toContain("markAllGate.current.end()");
  expect(bell).toContain("setLoading(true)");
  expect(bell).toContain("setLoading(false)");
 });
});
