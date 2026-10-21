import fs from "fs";
import path from "path";

const messages = fs.readFileSync(path.join(process.cwd(), "src/components/tpo/MessagesPanel.js"), "utf8");
const notifications = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/notifications.js"), "utf8");

test("message drafts are scoped per conversation instead of shared across recruiter threads", () => {
  expect(messages).toContain("const [drafts, setDrafts] = useState({})");
  expect(messages).toContain("thread:\${active.id}");
  expect(messages).toContain("drive:\${jobId}:\${recruiterId}");
});

test("failed message history and recruiter lookup are explicit and block blind replies", () => {
  expect(messages).toContain("Conversation history unavailable");
  expect(messages).toContain("Retry the conversation before replying");
  expect(messages).toContain("Recruiter list unavailable");
  expect(messages).toContain("Discard this message draft?");
  expect(messages).toContain("disabled={Boolean(threadError)}");
});

test("notification read state is reconciled only after successful server writes", () => {
  expect(notifications).toContain("const [markingAll, setMarkingAll] = useState(false)");
  expect(notifications).toContain("const [markingId, setMarkingId] = useState(null)");
  expect(notifications).toContain("await fetchWithErrorHandling(bellRead(n.id))");
  expect(notifications).toContain("if (markingRef.current) return");
  expect(notifications).toContain("Could not mark this notification as read");
});
