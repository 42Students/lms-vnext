export const projectTabs = [
  { key: "overview", label: "Overview" },
  { key: "team", label: "People & Meetings" },
  // key stays "sprints" (it's a routable ?tab= value and the internal identifier this
  // codebase threads through everywhere — see ProjectSprint.java's comment for why the
  // storage layer keeps this name) — only the label users see changes.
  { key: "sprints", label: "Releases and Sprints" },
  { key: "board", label: "Board" },
  // Renamed from "Tasks & Performance" -- the page only ever did allocation (bucket board,
  // auto-assign, reassignment), never actual performance/metrics, which made the old name a
  // promise the page didn't keep. Performance/metrics is deferred to its own future page, not
  // folded into this one. Key stays "performance" (routable ?tab= value) -- only the label changes.
  { key: "performance", label: "Task Allocation" },
  { key: "resources", label: "Resources" },
  { key: "activity", label: "Activity" },
];
