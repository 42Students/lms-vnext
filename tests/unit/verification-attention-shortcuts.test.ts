import {describe,expect,it} from "vitest";
import {verificationAttentionShortcuts,verificationAttentionShortcutPatch} from "@/modules/verification/attention-shortcuts";
describe("college verification attention shortcuts",()=>{
 it("deep-links to the waiting queue with a clean first page for each legacy flag",()=>{
  expect(verificationAttentionShortcuts).toHaveLength(3);
  for(const item of verificationAttentionShortcuts){
   expect(verificationAttentionShortcutPatch(item.attention)).toEqual({tab:"WAITING",attention:item.attention,page:"1"});
  }
 });
});
