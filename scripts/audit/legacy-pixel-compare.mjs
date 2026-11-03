#!/usr/bin/env node
/**
 * Dependency-free, deterministic old-LMS vs vNext PNG comparator.
 *
 * node scripts/audit/legacy-pixel-compare.mjs --old old.png --new new.png \
 *   --out /tmp/legacy-compare --threshold 0.005 --tolerance 8
 *
 * Optional --masks rectangles.json masks only explicitly justified dynamic
 * text regions. Masks above 2% of comparable pixels are rejected.
 * All results are diagnostic: a pixel pass does NOT close page/feature parity.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { deflateSync, inflateSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const MAGIC = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const LIMIT = 30_000_000;
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  crcTable[i] = c >>> 0;
}
function crc32(data) {
  let c = 0xffffffff;
  for (const value of data) c = crcTable[(c ^ value) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(kind, data) {
  const name = Buffer.from(kind, "ascii");
  const out = Buffer.alloc(data.length + 12);
  out.writeUInt32BE(data.length, 0);
  name.copy(out, 4);
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, data.length + 8)), data.length + 8);
  return out;
}
function bytesPerPixel(colorType) {
  const samples = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType];
  if (!samples) throw Error("PNG color type unsupported: " + colorType);
  return samples;
}
function pngError(message) {
  throw Error("Invalid or unsupported PNG: " + message);
}

export function decodePng(input) {
  const buffer = Buffer.from(input);
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(MAGIC)) pngError("signature");
  let offset = 8, width = 0, height = 0, colorType = -1, depth = -1;
  let palette = null, transparency = null, hasHeader = false, end = false;
  const data = [];
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    if (length > buffer.length - offset - 12) pngError("truncated chunk");
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const body = buffer.subarray(offset + 8, offset + 8 + length);
    if (crc32(buffer.subarray(offset + 4, offset + 8 + length)) !==
        buffer.readUInt32BE(offset + 8 + length)) pngError("CRC in " + type);
    if (type === "IHDR") {
      if (hasHeader || length !== 13) pngError("IHDR");
      hasHeader = true;
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8]; colorType = body[9];
      if (!width || !height || width * height > LIMIT) pngError("dimensions exceed safe limit");
      if (depth !== 8 || body[10] !== 0 || body[11] !== 0 || body[12] !== 0) {
        pngError("requires non-interlaced 8-bit PNG");
      }
      bytesPerPixel(colorType);
    } else if (type === "PLTE") palette = Buffer.from(body);
    else if (type === "tRNS") transparency = Buffer.from(body);
    else if (type === "IDAT") data.push(body);
    else if (type === "IEND") { end = true; break; }
    offset += length + 12;
  }
  if (!hasHeader || !end || data.length === 0) pngError("missing required chunks");
  if (colorType === 3 && (!palette || palette.length % 3 || palette.length === 0)) {
    pngError("indexed image missing palette");
  }
  const bpp = bytesPerPixel(colorType);
  const stride = width * bpp;
  const expected = height * (stride + 1);
  const inflated = inflateSync(Buffer.concat(data), { maxOutputLength: expected + 1 });
  if (inflated.length !== expected) pngError("unexpected inflated scanline length");
  const rgba = Buffer.alloc(width * height * 4);
  const prev = Buffer.alloc(stride);
  const row = Buffer.alloc(stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const filter = inflated[pos++];
    if (filter > 4) pngError("unknown scanline filter " + filter);
    for (let i = 0; i < stride; i++) {
      const raw = inflated[pos++];
      const a = i >= bpp ? row[i - bpp] : 0;
      const b = prev[i];
      const c = i >= bpp ? prev[i - bpp] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      if (filter === 2) predictor = b;
      if (filter === 3) predictor = Math.floor((a + b) / 2);
      if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        predictor = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      row[i] = (raw + predictor) & 255;
    }
    for (let x = 0; x < width; x++) {
      const s = x * bpp, d = (y * width + x) * 4;
      if (colorType === 6) {
        rgba[d] = row[s]; rgba[d + 1] = row[s + 1];
        rgba[d + 2] = row[s + 2]; rgba[d + 3] = row[s + 3];
      } else if (colorType === 2) {
        rgba[d] = row[s]; rgba[d + 1] = row[s + 1];
        rgba[d + 2] = row[s + 2]; rgba[d + 3] = 255;
        if (transparency?.length === 6 &&
            row[s] === transparency[1] && row[s + 1] === transparency[3] &&
            row[s + 2] === transparency[5]) rgba[d + 3] = 0;
      } else if (colorType === 0 || colorType === 4) {
        rgba[d] = rgba[d + 1] = rgba[d + 2] = row[s];
        rgba[d + 3] = colorType === 4 ? row[s + 1] :
          transparency?.length === 2 && row[s] === transparency[1] ? 0 : 255;
      } else {
        const index = row[s];
        if (index * 3 + 2 >= palette.length) pngError("palette index out of range");
        rgba[d] = palette[index * 3];
        rgba[d + 1] = palette[index * 3 + 1];
        rgba[d + 2] = palette[index * 3 + 2];
        rgba[d + 3] = transparency?.[index] ?? 255;
      }
    }
    row.copy(prev);
  }
  return { width, height, data: rgba };
}

export function encodePng({ width, height, data }) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 ||
      height < 1 || width * height > LIMIT || data.length !== width * height * 4) {
    throw Error("Invalid RGBA dimensions or buffer");
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(height, 4);
  header[8] = 8; header[9] = 6;
  const stride = width * 4, raw = Buffer.alloc(height * (stride + 1));
  const pixels = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    const dst = y * (stride + 1);
    raw[dst] = 0;
    pixels.copy(raw, dst + 1, y * stride, (y + 1) * stride);
  }
  return Buffer.concat([MAGIC, pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(raw, { level: 6 })), pngChunk("IEND", Buffer.alloc(0))]);
}

/** Two original-resolution images separated by a 12px neutral gutter. */
export function sideBySideImages(reference, candidate) {
  const gap = 12;
  const width = reference.width + candidate.width + gap;
  const height = Math.max(reference.height, candidate.height);
  if (width < 1 || height < 1 || width * height > LIMIT) {
    throw Error("Side-by-side image dimensions exceed safe limit");
  }
  const data = Buffer.alloc(width * height * 4, 255);
  for (let y = 0; y < height; y++) {
    for (let x = reference.width; x < reference.width + gap; x++) {
      const at = (y * width + x) * 4;
      data[at] = data[at + 1] = data[at + 2] = 226;
    }
    for (const [image, xOffset] of [[reference, 0], [candidate, reference.width + gap]]) {
      if (y >= image.height) continue;
      const from = y * image.width * 4;
      image.data.copy(data, (y * width + xOffset) * 4, from, from + image.width * 4);
    }
  }
  return { width, height, data };
}

function normalizeRect(rect, width, height) {
  if (!rect || ![rect.x, rect.y, rect.width, rect.height].every(Number.isInteger) ||
      rect.x < 0 || rect.y < 0 || rect.width <= 0 || rect.height <= 0 ||
      rect.x + rect.width > width || rect.y + rect.height > height ||
      typeof rect.reason !== "string" || rect.reason.trim().length < 8) {
    throw Error("Mask must have bounded integer x/y/width/height and a meaningful reason");
  }
  return rect;
}
export function compareImages(old, candidate, opts = {}) {
  const { width, height } = old;
  if (!width || !height || !candidate.width || !candidate.height) throw Error("Empty image");
  if (width * height > LIMIT || candidate.width * candidate.height > LIMIT) {
    throw Error("Image too large");
  }
  const tolerance = opts.tolerance ?? 8;
  const threshold = opts.threshold ?? 0.005;
  if (!Number.isInteger(tolerance) || tolerance < 0 || tolerance > 255 ||
      !Number.isFinite(threshold) || threshold < 0 || threshold > 1) {
    throw Error("Invalid threshold or per-channel tolerance");
  }
  const w = Math.max(width, candidate.width);
  const h = Math.max(height, candidate.height);
  if (w * h > LIMIT) throw Error("Combined comparison dimensions exceed safe limit");
  const masked = new Uint8Array(width * height);
  for (const rect of opts.masks ?? []) {
    normalizeRect(rect, width, height);
    for (let y = rect.y; y < rect.y + rect.height; y++)
      masked.fill(1, y * width + rect.x, y * width + rect.x + rect.width);
  }
  const maskedCount = masked.reduce((n, m) => n + m, 0);
  if (maskedCount / (width * height) > 0.02) {
    throw Error("Masked area exceeds 2% of the old screenshot");
  }
  const diff = Buffer.alloc(w * h * 4, 255);
  const overlay = Buffer.alloc(w * h * 4, 255);
  let different = 0, comparable = 0, absolute = 0;
  let left = w, top = h, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const oldPresent = x < width && y < height;
    const newPresent = x < candidate.width && y < candidate.height;
    const src = oldPresent ? (y * width + x) * 4 : -1;
    const dst = newPresent ? (y * candidate.width + x) * 4 : -1;
    const at = (y * w + x) * 4;
    const isMasked = oldPresent && masked[y * width + x] === 1;
    if (isMasked && newPresent) {
      diff[at] = 216; diff[at + 1] = 226; diff[at + 2] = 236;
    } else {
      comparable++;
      let maxDelta = 0;
      for (let c = 0; c < 4; c++) {
        const av = oldPresent ? old.data[src + c] : c === 3 ? 255 : 255;
        const bv = newPresent ? candidate.data[dst + c] : c === 3 ? 255 : 255;
        const delta = Math.abs(av - bv);
        absolute += delta;
        if (delta > maxDelta) maxDelta = delta;
        overlay[at + c] = (av + bv) >> 1;
      }
      const pixelDiffers = !oldPresent || !newPresent || maxDelta > tolerance;
      if (pixelDiffers) {
        different++;
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
        diff[at] = 255; diff[at + 1] = 35; diff[at + 2] = 55;
      }
    }
    diff[at + 3] = overlay[at + 3] = 255;
  }
  const differentRatio = comparable ? different / comparable : 1;
  const dimensionMatch = width === candidate.width && height === candidate.height;
  const results = {
    pass: dimensionMatch && differentRatio <= threshold,
    reference: { width, height },
    candidate: { width: candidate.width, height: candidate.height },
    dimensionMatch, comparablePixels: comparable, maskedPixels: maskedCount,
    differentPixels: different, differentRatio,
    meanAbsoluteChannelDifference: comparable ? absolute / (comparable * 4) : 255,
    threshold, tolerance,
    differenceBounds: right < left ? null : {
      x: left, y: top, width: right - left + 1, height: bottom - top + 1,
    },
    note: "Pixel diagnostics only; state semantics, layout, behavior and human review are additional gates.",
  };
  return {
    results, diff: { width: w, height: h, data: diff },
    overlay: { width: w, height: h, data: overlay },
  };
}

function args(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i];
    if (!["--old", "--new", "--out", "--threshold", "--tolerance", "--masks"].includes(name))
      throw Error("Unknown argument " + name);
    out[name.slice(2)] = argv[++i];
    if (out[name.slice(2)] == null) throw Error("Missing value for " + name);
  }
  for (const key of ["old", "new", "out"]) if (!out[key]) throw Error("Missing --" + key);
  return out;
}

function main() {
  try {
    const input = args(process.argv.slice(2));
    const reference = decodePng(readFileSync(resolve(input.old)));
    const candidate = decodePng(readFileSync(resolve(input.new)));
    const masks = input.masks ? JSON.parse(readFileSync(resolve(input.masks), "utf8")) : [];
    if (!Array.isArray(masks)) throw Error("Masks file must contain an array");
    const comparison = compareImages(reference, candidate, {
      tolerance: input.tolerance == null ? undefined : Number(input.tolerance),
      threshold: input.threshold == null ? undefined : Number(input.threshold),
      masks,
    });
    const dir = resolve(input.out);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "diff.png"), encodePng(comparison.diff));
    writeFileSync(join(dir, "overlay.png"), encodePng(comparison.overlay));
    writeFileSync(join(dir, "side-by-side.png"), encodePng(sideBySideImages(reference, candidate)));
    writeFileSync(join(dir, "report.json"), JSON.stringify({
      ...comparison.results, referenceFile: resolve(input.old),
      candidateFile: resolve(input.new), masks,
    }, null, 2) + "\n");
    process.stdout.write(JSON.stringify(comparison.results, null, 2) + "\n");
    process.exitCode = comparison.results.pass ? 0 : 1;
  } catch (error) {
    process.stderr.write(String(error?.stack ?? error) + "\n");
    process.exitCode = 2;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
