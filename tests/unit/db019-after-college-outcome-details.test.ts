import {describe,expect,it} from "vitest";
import {normalizeTpoAfterCollegeDetails,AfterCollegeDetailValidationError}
 from "@/modules/placements/tpo-after-college-details-model";

const catalog=[
 {label:"Family business",outcome:"ENTREPRENEURSHIP"},
 {label:"Civil services",outcome:"COMPETITIVE_EXAMS"},
 {label:"Research programme",outcome:"HIGHER_STUDIES"},
];
describe("DB019 staff-only after-college detail crosswalk",()=>{
 it("accepts only a matching college-specific custom label, with a separate optional detail",()=>{
  expect(normalizeTpoAfterCollegeDetails("ENTREPRENEURSHIP",{
   outcomeLabel:" Family business ",outcomeDetail:"  Family enterprise ",
  },null,catalog)).toEqual({outcomeLabel:"Family business",outcomeDetail:"Family enterprise"});
 });
 it("does not accept arbitrary labels or a label belonging to another outcome",()=>{
  for(const input of [
    {outcomeLabel:"Civil services"},{outcomeLabel:"Unapproved label"},
    {outcomeLabel:"A".repeat(61)},
  ])expect(()=>normalizeTpoAfterCollegeDetails(
    "ENTREPRENEURSHIP",input,null,catalog,
  )).toThrow(AfterCollegeDetailValidationError);
  expect(()=>normalizeTpoAfterCollegeDetails(
   "ENTREPRENEURSHIP",{outcomeLabel:"Family business"},null,{untrusted:true},
  )).toThrow(AfterCollegeDetailValidationError);
 });
 it("normalizes blank fields to null without inventing a label",()=>{
  expect(normalizeTpoAfterCollegeDetails("HIGHER_STUDIES",{
   outcomeLabel:"  ",outcomeDetail:" ",
  },null,catalog)).toEqual({outcomeLabel:null,outcomeDetail:null});
 });
 it("preserves fields on a same-outcome legacy editor retry with no detail keys",()=>{
  const previous={outcome:"ENTREPRENEURSHIP",outcomeLabel:"Family business",outcomeDetail:"Family firm"};
  expect(normalizeTpoAfterCollegeDetails("ENTREPRENEURSHIP",{},previous,catalog))
   .toEqual({outcomeLabel:"Family business",outcomeDetail:"Family firm"});
  expect(normalizeTpoAfterCollegeDetails("HIGHER_STUDIES",{},previous,catalog))
   .toEqual({outcomeLabel:null,outcomeDetail:null});
 });
 it("allows staff to change one field without discarding the other",()=>{
  const previous={outcome:"ENTREPRENEURSHIP",outcomeLabel:"Family business",outcomeDetail:"Old"};
  expect(normalizeTpoAfterCollegeDetails("ENTREPRENEURSHIP",{
   outcomeDetail:"New",
  },previous,catalog)).toEqual({outcomeLabel:"Family business",outcomeDetail:"New"});
 });
 it("rejects destination detail beyond its registered varchar(200) limit",()=>{
  expect(()=>normalizeTpoAfterCollegeDetails("HIGHER_STUDIES",{
   outcomeDetail:"D".repeat(201),
  },null,catalog)).toThrow(AfterCollegeDetailValidationError);
 });
});
