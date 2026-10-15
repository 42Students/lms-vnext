import { describe,it,expect,vi } from "vitest";
import { scheduleLearnerQuizReturn } from "@/modules/courses/learner-quiz-return-model";
describe("learner quiz post-submission navigation cleanup",()=>{
  it("can cancel a scheduled return on unmount or new navigation",()=>{
    const action=vi.fn();let handler:(()=>void)|null=null;
    const schedule=vi.fn((fn:()=>void,_delay:number)=>{handler=fn;return 11;});
    const cancel=vi.fn((_id:number)=>{handler=null;});
    const dispose=scheduleLearnerQuizReturn(action,2000,schedule,cancel);
    expect(schedule).toHaveBeenCalledWith(action,2000);
    dispose();expect(cancel).toHaveBeenCalledWith(11);
    expect(handler).toBeNull();expect(action).not.toHaveBeenCalled();
  });
});
