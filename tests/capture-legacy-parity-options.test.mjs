import { test } from "node:test";
import assert from "node:assert/strict";
import { parseOptions } from "../scripts/audit/capture-legacy-parity.mjs";

test("local, query-free, read-only capture URL is accepted", () => {
  const opts = parseOptions([
    "--url", "http://localhost:3000/mentor/calendar",
    "--out", "/tmp/mentor-001",
    "--state", "/tmp/mentor-session.json",
    "--reference", "/tmp/old.png",
  ]);
  assert.equal(opts.url, "http://localhost:3000/mentor/calendar");
  assert.equal(opts.out, "/tmp/mentor-001");
  assert.equal(opts.state, "/tmp/mentor-session.json");
  assert.equal(opts.reference, "/tmp/old.png");
});

test("remote URLs require explicit read-only flag AND TLS", () => {
  assert.throws(() => parseOptions([
    "--url", "https://test.example.com/mentor/calendar", "--out", "/tmp/a",
  ]), /Remote capture requires/);
  assert.throws(() => parseOptions([
    "--url", "http://test.example.com/mentor/calendar", "--out", "/tmp/a",
    "--allow-readonly-remote",
  ]), /Remote capture requires/);
  const result = parseOptions([
    "--url", "https://test.example.com/mentor/calendar", "--out", "/tmp/a",
    "--allow-readonly-remote",
  ]);
  assert.equal(result["allow-readonly-remote"], true);
});

test("URLs containing secrets, fragments or inline credential strings are rejected", () => {
  for (const url of [
    "http://localhost:3000/mentor/calendar?secret=token",
    "http://localhost:3000/mentor/calendar#tab",
    "http://person:password@localhost:3000/mentor/calendar",
    "javascript:alert(1)",
  ]) {
    assert.throws(() => parseOptions(["--url", url, "--out", "/tmp/a"]));
  }
});

test("allowlisted deep-link state queries are accepted and unknown query keys rejected", () => {
  const permitted = parseOptions([
    "--url", "http://localhost:3000/mentor/calendar?tab=meetings&status=ALL",
    "--out", "/tmp/deeplink",
  ]);
  assert.match(permitted.url, /tab=meetings/);
  assert.throws(() => parseOptions([
    "--url", "http://localhost:3000/mentor/calendar?access_token=unsafe",
    "--out", "/tmp/deeplink",
  ]), /not on the non-secret visual state allowlist/);
});

test("scroll positions must be nonnegative integers and flags require values", () => {
  const args = ["--url", "http://localhost:3000/mentor/calendar", "--out", "/tmp/a"];
  assert.equal(parseOptions([...args, "--scroll-y", "800"])["scroll-y"], "800");
  assert.throws(() => parseOptions([...args, "--scroll-y", "-2"]), /nonnegative integer/);
  assert.throws(() => parseOptions([...args, "--scroll-y", "1.5"]), /nonnegative integer/);
  assert.throws(() => parseOptions([...args, "--reference"]), /Missing value/);
});

test("misnamed or destructive/unsupported arguments are rejected", () => {
  assert.throws(() => parseOptions([
    "--url", "http://localhost:3000/mentor/calendar",
    "--out", "/tmp/a", "--click-submit", "button",
  ]), /Unknown option/);
  assert.throws(() => parseOptions(["--out", "/tmp/a"]), /Missing --url/);
  assert.throws(() => parseOptions(["--url", "http://localhost:3000"]), /Missing --out/);
});
