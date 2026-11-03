import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { compareImages, decodePng, encodePng } from "../scripts/audit/legacy-pixel-compare.mjs";

const CLI = fileURLToPath(new URL("../scripts/audit/legacy-pixel-compare.mjs", import.meta.url));
const pixel = (width, height, rgba = [255, 255, 255, 255]) => ({
  width, height,
  data: Buffer.from(Array.from({ length: width * height }, () => rgba).flat()),
});
function paint(image, x, y, rgba) {
  const offset = (y * image.width + x) * 4;
  for (let n = 0; n < 4; n++) image.data[offset + n] = rgba[n];
}
const temporary = () => mkdtempSync(join(tmpdir(), "lms-pixel-"));

test("PNG encoding and decoding round trip pixels, alpha, dimensions and CRC", () => {
  const source = pixel(3, 2, [31, 76, 241, 255]);
  paint(source, 0, 0, [10, 20, 30, 80]);
  paint(source, 2, 1, [255, 220, 11, 255]);
  const encoded = encodePng(source);
  const decoded = decodePng(encoded);
  assert.equal(decoded.width, 3);
  assert.equal(decoded.height, 2);
  assert.deepEqual(decoded.data, source.data);
});

test("identical images pass and have no difference bounds", () => {
  const image = pixel(4, 3);
  const result = compareImages(image, decodePng(encodePng(image)));
  assert.equal(result.results.pass, true);
  assert.equal(result.results.differentPixels, 0);
  assert.equal(result.results.differentRatio, 0);
  assert.equal(result.results.differenceBounds, null);
});

test("one changed pixel fails strict comparison and produces a real diff", () => {
  const a = pixel(10, 10), b = pixel(10, 10);
  paint(b, 4, 3, [10, 20, 30, 255]);
  const { results, diff } = compareImages(a, b, { threshold: 0, tolerance: 0 });
  assert.equal(results.pass, false);
  assert.equal(results.differentPixels, 1);
  assert.equal(results.comparablePixels, 100);
  assert.equal(results.differentRatio, 0.01);
  assert.deepEqual(results.differenceBounds, { x: 4, y: 3, width: 1, height: 1 });
  const red = decodePng(encodePng(diff));
  assert.deepEqual([...red.data.subarray((3 * 10 + 4) * 4, (3 * 10 + 5) * 4)],
    [255, 35, 55, 255]);
});

test("sub-tolerance antialiasing noise does not fail calibrated comparison", () => {
  const a = pixel(4, 4), b = pixel(4, 4);
  paint(b, 0, 0, [250, 249, 250, 255]);
  assert.equal(compareImages(a, b, { threshold: 0, tolerance: 8 }).results.pass, true);
  assert.equal(compareImages(a, b, { threshold: 0, tolerance: 0 }).results.pass, false);
});

test("different screenshot dimensions always fail, even when extra pixels are white", () => {
  const a = pixel(4, 4), b = pixel(4, 5);
  const { results } = compareImages(a, b);
  assert.equal(results.pass, false);
  assert.equal(results.dimensionMatch, false);
  assert.equal(results.differentPixels, 4);
  assert.deepEqual(results.differenceBounds, { x: 0, y: 4, width: 4, height: 1 });
});

test("a small justified dynamic mask is allowed, but large masks and missing reasons are rejected", () => {
  const a = pixel(20, 20), b = pixel(20, 20);
  paint(b, 0, 0, [0, 0, 0, 255]);
  const mask = { x: 0, y: 0, width: 1, height: 1, reason: "Different test-account initials" };
  const checked = compareImages(a, b, { threshold: 0, tolerance: 0, masks: [mask] });
  assert.equal(checked.results.pass, true);
  assert.equal(checked.results.maskedPixels, 1);
  assert.throws(
    () => compareImages(a, b, { masks: [{ ...mask, width: 20, height: 1 }] }),
    /Masked area exceeds 2%/,
  );
  assert.throws(
    () => compareImages(a, b, { masks: [{ ...mask, reason: "" }] }),
    /meaningful reason/,
  );
  assert.throws(
    () => compareImages(a, b, { masks: [{ ...mask, x: 200 }] }),
    /bounded integer/,
  );
});

test("bad CRC or unsupported PNG input fails rather than silently reporting parity", () => {
  const valid = encodePng(pixel(2, 2));
  const corrupted = Buffer.from(valid);
  corrupted[20] ^= 1;
  assert.throws(() => decodePng(corrupted), /CRC/);
  assert.throws(() => decodePng(Buffer.from("hello")), /Invalid or unsupported PNG/);
});

test("CLI writes overlay/diff/report and uses exit code 1 for a visual mismatch", () => {
  const dir = temporary();
  try {
    const oldFile = join(dir, "old.png"), newFile = join(dir, "new.png");
    const out = join(dir, "out");
    const a = pixel(16, 16), b = pixel(16, 16);
    paint(b, 3, 3, [0, 0, 0, 255]);
    writeFileSync(oldFile, encodePng(a));
    writeFileSync(newFile, encodePng(b));
    const first = spawnSync(process.execPath, [CLI, "--old", oldFile,
      "--new", newFile, "--out", out, "--threshold", "0", "--tolerance", "0"],
    { encoding: "utf8" });
    assert.equal(first.status, 1, first.stderr);
    const report = JSON.parse(readFileSync(join(out, "report.json"), "utf8"));
    assert.equal(report.differentPixels, 1);
    assert.equal(report.pass, false);
    assert.equal(existsSync(join(out, "overlay.png")), true);
    assert.equal(existsSync(join(out, "diff.png")), true);
    assert.equal(decodePng(readFileSync(join(out, "overlay.png"))).width, 16);
    const second = spawnSync(process.execPath, [CLI, "--old", oldFile,
      "--new", oldFile, "--out", join(dir, "same")], { encoding: "utf8" });
    assert.equal(second.status, 0, second.stderr);
  } finally { rmSync(dir, { force: true, recursive: true }); }
});
