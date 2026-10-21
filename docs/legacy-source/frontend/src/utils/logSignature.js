// Browser-side twin of the backend's LogSignatureUtil, so a group of log entries on this page can be
// matched to the tracked error (fix status, mute reason, linked issue) the alerting poller stored for
// it. The backend hashes normalize(message-as-in-the-list-view, httpPath); everything below reproduces
// that byte for byte, including the 1500-character truncation the list view applies before hashing.
const UUID_RE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
const UUID_FULL_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const NUMBER_RE = /\b\d+\b/g;
const WHITESPACE_RE = /\s+/g;
const SUMMARY_MESSAGE_LIMIT = 1500;

function normalizePath(path) {
  return path
    .split("/")
    .filter((segment) => segment !== "")
    .map((segment) => (/^\d+$/.test(segment) || UUID_FULL_RE.test(segment) ? "<id>" : segment))
    .map((segment) => `/${segment}`)
    .join("");
}

export function summaryMessage(message) {
  if (message == null) return message;
  return message.length <= SUMMARY_MESSAGE_LIMIT ? message : `${message.slice(0, SUMMARY_MESSAGE_LIMIT)}…`;
}

/** The exact string the backend hashes for an entry (exception type is always null in the poller). */
export function normalizeSignature(message, httpPath) {
  const base = (message == null ? "" : summaryMessage(message)) + (httpPath == null ? "" : `@${normalizePath(httpPath)}`);
  return base
    .toLowerCase()
    .replace(UUID_RE, "<uuid>")
    .replace(EMAIL_RE, "<email>")
    .replace(NUMBER_RE, "<n>")
    .replace(WHITESPACE_RE, " ")
    .trim();
}

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function utf8Bytes(text) {
  if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(text);
  return Uint8Array.from(unescape(encodeURIComponent(text)), (ch) => ch.charCodeAt(0));
}

/** Plain SHA-256, for pages where crypto.subtle is unavailable (plain http) and for test environments. */
export function sha256HexSync(text) {
  const bytes = utf8Bytes(text);
  const bitLength = bytes.length * 8;
  const padded = new Uint8Array((((bytes.length + 9 + 63) >> 6) << 6));
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLength / 0x100000000));
  view.setUint32(padded.length - 4, bitLength >>> 0);

  const h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Uint32Array(64);
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < padded.length; offset += 64) {
    for (let i = 0; i < 16; i += 1) w[i] = view.getUint32(offset + i * 4);
    for (let i = 16; i < 64; i += 1) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0; h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
    h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0; h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
  }
  return h.map((x) => x.toString(16).padStart(8, "0")).join("");
}

export async function sha256Hex(text) {
  const subtle = typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.subtle;
  if (subtle && typeof TextEncoder !== "undefined") {
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return sha256HexSync(text);
}

export async function signatureHash(entry) {
  return sha256Hex(normalizeSignature(entry?.message, entry?.httpPath));
}
