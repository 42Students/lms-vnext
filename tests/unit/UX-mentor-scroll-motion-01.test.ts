import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(name:string)=>readFileSync("src/components/projects/"+name+".tsx","utf8");

describe("UX-mentor-scroll-motion-01 invisible scrollbar affordances",()=>{
  it("keeps the allocation workload responsive and uses DataTable's labelled ScrollCue",()=>{
    const source=read("mentor-task-allocation");
    expect(source).toContain('import {DataTable} from "@/components/ui/data-table"');
    expect(source).toContain('caption="Workload by learner"');
    expect(source).toContain("mobilePriority:\"primary\"");
    expect(source).toContain("mobilePriority:\"secondary\"");
    expect(source).toContain("empty={<p>No learners to summarize yet.</p>}");
    expect(source).not.toMatch(/<table\\b/);
  });
  it("makes allocation cards discoverable and keyboard scrollable",()=>{
    const source=read("mentor-task-allocation");
    expect(source).toContain('role="region" aria-label="Task allocation cards; scroll sideways for more learners" tabIndex={0}');
    expect(source).toContain("overscroll-x-contain");
    expect(source).toContain("[mask-image:linear-gradient(to_right,black_0%,black_94%,transparent_100%)]");
    expect(source).toContain("focus-visible:outline-2");
  });
  it("makes the status lanes discoverable without clipping touch or keyboard scrolling",()=>{
    const source=read("mentor-lane-board");
    expect(source).toContain('role="region" aria-label="Project task board; scroll sideways to see more status columns" tabIndex={0}');
    expect(source).toContain("overflow-x-auto overscroll-x-contain");
    expect(source).toContain("mask-image:linear-gradient");
    expect(source).toContain("focus-visible:outline-2");
  });
  it("contains native task-dialog vertical scroll, keeps actions visible, and returns focus",()=>{
    const source=read("mentor-board-task-detail-dialog");
    expect(source).toContain("overflow-y-auto overscroll-contain");
    expect(source).toContain('aria-labelledby="mentor-board-task-title"');
    expect(source).toContain("sticky top-0");
    expect(source).toContain("Scroll for more task details and activity.");
    expect(source).toContain("el.showModal()");
    expect(source).toContain("opener.current?.focus()");
    expect(source).toContain("onCancel={event=>{event.preventDefault();ref.current?.close();}}");
  });
  it("does not add hardcoded motion durations to the updated surfaces",()=>{
    for(const name of ["mentor-task-allocation","mentor-lane-board","mentor-board-task-detail-dialog"]){
      expect(read(name)).not.toMatch(/duration-\\d+|transition-all|animate-\\[.*?ms/);
    }
  });
});
