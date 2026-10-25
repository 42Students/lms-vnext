import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";
const read=(name:string)=>readFileSync("src/components/projects/"+name+".tsx","utf8");
const boardCss=()=>readFileSync("src/components/projects/legacy-project-board.module.css","utf8");

describe("UX-mentor-scroll-motion-01 invisible scrollbar affordances",()=>{
  it("keeps the allocation workload responsive and uses DataTable's labelled ScrollCue",()=>{
    const source=read("mentor-task-allocation");
    expect(source).toContain('import {DataTable} from "@/components/ui/data-table"');
    expect(source).toContain('caption="Workload by learner"');
    expect(source).toContain("mobilePriority:\"primary\"");
    expect(source).toContain("mobilePriority:\"secondary\"");
    expect(source).toContain('empty={<EmptyState title="No learners to summarize" description="No learners to summarize yet."');
    expect(source).not.toMatch(/<table\b/);
  });
  it("makes allocation cards discoverable and keyboard scrollable",()=>{
    const source=read("mentor-task-allocation");
    expect(source).toContain('role="region" aria-label="Task allocation cards; scroll sideways for more learners" tabIndex={0}');
    expect(source).toContain('className={styles["scrollRegion"]}');
    expect(boardCss()).toContain("overscroll-behavior-x: contain");
    expect(boardCss()).toContain(".scrollRegion:focus-visible");
  });
  it("makes the status lanes discoverable without clipping touch or keyboard scrolling",()=>{
    const source=read("mentor-lane-board");
    expect(source).toContain('role="region" aria-label="Project task board; scroll sideways to see more status columns" tabIndex={0}');
    expect(source).toContain('className={styles["scrollRegion"]}');
    expect(boardCss()).toContain("overflow-x: auto");
    expect(boardCss()).toContain("overscroll-behavior-x: contain");
    expect(boardCss()).toContain(".scrollRegion:focus-visible");
  });
  it("contains native task-dialog vertical scroll, keeps actions visible, and returns focus",()=>{
    const source=read("mentor-board-task-detail-dialog");
    expect(source).toContain('<Dialog open={true} onOpenChange={next=>{if(!next)onClose();}}');
    expect(source).toContain("Scroll for more task details and activity.");
    const dialog=readFileSync("src/components/ui/dialog.tsx","utf8");
    expect(dialog).toContain('axis="y"');
    expect(dialog).toContain("overscroll-contain");
    expect(dialog).toContain("useOverlayExit(ref, opener, open, 180)");
    expect(dialog).toContain("onCancel={event => { event.preventDefault();");
  });
  it("does not add hardcoded motion durations to the updated surfaces",()=>{
    for(const name of ["mentor-task-allocation","mentor-lane-board","mentor-board-task-detail-dialog"]){
      expect(read(name)).not.toMatch(/duration-\d+|transition-all|animate-\[.*?ms/);
    }
  });
});
