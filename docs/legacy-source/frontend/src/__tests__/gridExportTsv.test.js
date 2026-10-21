import { toTsv } from "@/components/tpo/grid/gridExport";

// BE-0053: Copy rows pastes into Excel/Sheets, so it neutralises formula-looking text like the CSV download does.
test("copied rows paste formula-looking text as text, and keep numbers", () => {
  const out = toTsv(["Name", "Note", "Marks"], [
    ["=HYPERLINK(\"http://x\",\"y\")", "+1 call", -3],
    ["@SUM(A1)", " -x", 7.5],
    ["Asha", "line\nbreak\there", 0],
  ]);
  expect(out.split("\n")).toEqual([
    "Name\tNote\tMarks",
    "'=HYPERLINK(\"http://x\",\"y\")\t'+1 call\t-3",
    "'@SUM(A1)\t' -x\t7.5",
    "Asha\tline break here\t0",
  ]);
});
