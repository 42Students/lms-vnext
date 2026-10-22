import {describe,it,expect} from "vitest";
import {parseTpoReminderPreview,tpoReminderReceiptMessage} from "@/modules/placements/tpo-reminder-result-model";

describe("TPO reminder outcome verification",()=>{
 const allowed={count:3,day:"2026-10-22",alreadySent:false,allowed:true,reason:null,previewToken:"sealed"};
 it("only opens confirmation on a complete server-approved preview",()=>{
  expect(parseTpoReminderPreview(allowed)).toEqual(allowed);
  expect(parseTpoReminderPreview({...allowed,previewToken:null})).toBeNull();
  expect(parseTpoReminderPreview({...allowed,count:-1})).toBeNull();
  expect(parseTpoReminderPreview({...allowed,allowed:"yes"})).toBeNull();
 });
 it("reports only confirmed recipient count and caps it at the reviewed preview",()=>{
  expect(tpoReminderReceiptMessage({reminded:3,alreadySent:false,reason:null},3))
   .toBe("3 eligible registered students were reminded in-app.");
  expect(tpoReminderReceiptMessage({reminded:4,alreadySent:false,reason:null},3)).toBeNull();
  expect(tpoReminderReceiptMessage({reminded:undefined,alreadySent:false,reason:null},3)).toBeNull();
  expect(tpoReminderReceiptMessage({reminded:0,alreadySent:true,reason:"cooldown"},3))
   .toBe("Already reminded within the past 20 hours");
  expect(tpoReminderReceiptMessage({reminded:1,alreadySent:true,reason:null},3)).toBeNull();
 });
});
