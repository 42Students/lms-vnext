import {describe,expect,it} from "vitest";
import {nextMentorBoardFocus} from
 "@/modules/projects/mentor-board-keyboard-focus-model";
describe("Mentor Board full filtered J/K focus",()=>{
 const ids=Array.from({length:230},(_,i)=>"task-"+i);
 it("crosses previously loaded 150-task List boundary",()=>{
  expect(nextMentorBoardFocus(ids,"task-149","j"))
   .toEqual({id:"task-150",index:150});
  expect(nextMentorBoardFocus(ids,"task-155","k"))
   .toEqual({id:"task-154",index:154});
 });
 it("initializes to first task if current task is not visible",()=>{
  expect(nextMentorBoardFocus(ids,"filtered-out","j"))
   .toEqual({id:"task-0",index:0});
 });
 it("never produces an out-of-range selection",()=>{
  expect(nextMentorBoardFocus(ids,"task-0","k"))
   .toEqual({id:"task-0",index:0});
  expect(nextMentorBoardFocus(ids,"task-229","j"))
   .toEqual({id:"task-229",index:229});
  expect(nextMentorBoardFocus([],null,"j")).toBeNull();
 });
 it("does not mutate source order",()=>{
  const entries=["a","b"];
  nextMentorBoardFocus(entries,"a","j");
  expect(entries).toEqual(["a","b"]);
 });
});
