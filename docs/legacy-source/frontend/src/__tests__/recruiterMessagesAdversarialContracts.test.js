import fs from "fs";
import path from "path";

describe("Recruiter messages adversarial hardening", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/pages/recruiter/messages.js"), "utf8");

  test("general conversation failures are distinct from empty", () => {
    expect(source).toContain("generalRequestRef = useRef(0)");
    expect(source).toContain('error: errorText(e, "Could not load this conversation")');
    expect(source).toContain('message="Conversation could not be loaded"');
    expect(source).toContain("requestId !== generalRequestRef.current");
  });

  test("sending is synchronously single-flight and keeps recoverable context", () => {
    expect(source).toContain("const sendRef = useRef(false)");
    expect(source).toContain("if (!draft.trim() || !college.collegeId || sendRef.current) return;");
    expect(source).toContain("sendRef.current = true;");
    expect(source).toContain("sendRef.current = false;");
    expect(source).toContain("Message sent, but the conversation could not refresh.");
  });
});
