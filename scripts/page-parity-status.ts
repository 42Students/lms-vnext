import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export type PageChecklistFile = {
  file: string;
  done: number;
  open: number;
  total: number;
  percent: number;
};

export type PageChecklistReport = {
  done: number;
  open: number;
  total: number;
  percent: number;
  files: PageChecklistFile[];
};

export function countChecklist(markdown: string) {
  let done = 0;
  let open = 0;
  for (const line of markdown.split("\n")) {
    if (/^\s*- \[[xX]\]\s+/.test(line)) done += 1;
    if (/^\s*- \[ \]\s+/.test(line)) open += 1;
  }
  const total = done + open;
  return {
    done,
    open,
    total,
    percent:
      total === 0
        ? 0
        : Math.round((done / total) * 10_000) / 100,
  };
}

export function buildPageChecklistReport(
  files: { file: string; markdown: string }[],
): PageChecklistReport {
  const details = files.map(({ file, markdown }) => ({
    file,
    ...countChecklist(markdown),
  }));
  const done = details.reduce((sum, item) => sum + item.done, 0);
  const open = details.reduce((sum, item) => sum + item.open, 0);
  const total = done + open;
  return {
    done,
    open,
    total,
    percent:
      total === 0
        ? 0
        : Math.round((done / total) * 10_000) / 100,
    files: details,
  };
}

export function runPageParityStatus() {
  const dir = path.join(process.cwd(), "docs/parity");
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .sort()
    .map((file) => ({
      file,
      markdown: fs.readFileSync(path.join(dir, file), "utf8"),
    }));

  const report = buildPageChecklistReport(files);
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return;
  }

  process.stdout.write(
    [
      "LMS vNext detailed page parity",
      "",
      `Checked: ${report.done}/${report.total} (${report.percent}%)`,
      `Open: ${report.open}`,
      "",
      ...report.files.map(
        (file) =>
          `${file.file}: ${file.done}/${file.total} checked, ${file.open} open`,
      ),
      "",
    ].join("\n"),
  );
}

const invoked = process.argv[1];
if (
  invoked &&
  import.meta.url === pathToFileURL(invoked).href
) {
  runPageParityStatus();
}
