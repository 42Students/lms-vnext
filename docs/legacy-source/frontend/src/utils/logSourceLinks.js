const REPO = "https://github.com/42Students/lms";
const APP_PACKAGE_PREFIX = "com._42students";
const FRAME_RE = /^\s*at\s+([\w.$]+)\.([\w$<>]+)\(([\w$]+\.java):(\d+)\)/;

/** Application stack frames only (framework frames are noise when looking for our own bug). */
export function parseAppFrames(exception, max = 5) {
  if (!exception) return [];
  const frames = [];
  for (const line of String(exception).split("\n")) {
    const match = FRAME_RE.exec(line);
    if (!match) continue;
    const [, qualified, method, file, lineNumber] = match;
    if (!qualified.startsWith(APP_PACKAGE_PREFIX)) continue;
    const base = file.replace(/\.java$/, "");
    const at = qualified.indexOf(`.${base}`);
    const packagePath = at > 0 ? qualified.slice(0, at).replace(/\./g, "/") : null;
    frames.push({
      className: qualified.slice(qualified.lastIndexOf(".") + 1),
      method,
      file,
      line: Number(lineNumber),
      path: packagePath ? `src/main/java/${packagePath}/${file}` : null,
    });
    if (frames.length >= max) break;
  }
  return frames;
}

/** GitHub link to the exact line, pinned to a commit when known so it still points at the right code later. */
export function frameLink(frame, ref = "prod-2026") {
  if (!frame || !frame.path) return null;
  return `${REPO}/blob/${ref}/${frame.path}#L${frame.line}`;
}

export function frameLabel(frame) {
  return frame ? `${frame.file}:${frame.line} (${frame.className}.${frame.method})` : "";
}

/** A repository search for a class -- the fallback when a log line has a logger but no stack trace. */
export function loggerSearchLink(logger) {
  if (!logger) return null;
  const simple = String(logger).split(".").pop();
  return simple ? `${REPO}/search?q=${encodeURIComponent(simple)}&type=code` : null;
}
