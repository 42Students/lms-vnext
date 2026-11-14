import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => readFileSync(join(process.cwd(), file), "utf8");

describe("UX-G151 project interaction guards", () => {
  it("locks learner task create and delete before React pending state updates", () => {
    const component = source("src/components/projects/learner-own-task-controls.tsx");
    expect(component.match(/const inFlightRef=useRef\(false\);/g)).toHaveLength(2);
    expect(component).toContain("||busy||inFlightRef.current||");
    expect(component).toContain("if(busy||inFlightRef.current)return;");
    expect(component.match(/inFlightRef.current=true;/g)).toHaveLength(2);
    expect(component.match(/finally\{inFlightRef.current=false;setBusy\(false\);\}/g)).toHaveLength(2);
    expect(component).toContain("expectedSprintUpdatedAt:");
  });

  it("keeps mentor confirmation writes locked and permits retry after error", () => {
    for (const filename of ["mentor-meeting-notes-editor.tsx", "mentor-meeting-reschedule.tsx"]) {
      const component = source("src/components/projects/" + filename);
      expect(component).toContain("const inFlightRef=useRef(false);");
      expect(component).toContain("||inFlightRef.current)return;");
      expect(component).toContain("inFlightRef.current=true;");
      expect(component).toContain("finally{inFlightRef.current=false;setPending(false);}");
      expect(component).toContain("expectedUpdatedAt:");
    }
  });

  it("serializes mentor task transitions and sprint moves", () => {
    const component = source("src/components/projects/mentor-lane-board.tsx");
    expect(component).toContain("const actionLock=useRef(false);");
    expect(component).toContain("||readOnly||busy||actionLock.current||");
    expect(component).toContain("if(readOnly||busy||actionLock.current||");
    expect(component.match(/actionLock.current=true;/g)).toHaveLength(2);
    expect(component.match(/finally\{actionLock.current=false;setBusy\(false\);\}/g)).toHaveLength(2);
    expect(component).toContain("expectedUpdatedAt:");
  });

  it("reinitializes native mobile selects when URL query props change", () => {
    const component = source("src/components/projects/learner-project-mobile-filters.tsx");
    for (const name of ["status", "attention", "work", "sort", "pageSize"]) {
      expect(component).toContain('} name="' + name + '" defaultValue=');
    }
    expect(component).toContain("onSubmit={cancelDebounce}");
    expect(component).toContain("form.current?.requestSubmit()");
  });

  it("shows the done-when criteria once while keeping the blocked-task alert", () => {
    const component = source("src/components/projects/learner-board-task-detail-dialog.tsx");
    expect(component.match(/<Heading level=\{3\}>Done when<\/Heading>/g)).toHaveLength(1);
    expect(component).not.toContain(">Acceptance criteria</Heading>");
    expect(component).toContain('task.status === "BLOCKED"');
    expect(component).toContain('role="alert"');
  });
});
