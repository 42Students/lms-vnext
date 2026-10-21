import { act, render } from "@testing-library/react";
import useLivePulse from "@/components/tpo/ui/useLivePulse";

function Probe({ pulse, onChange, active = true }) {
  useLivePulse(pulse, onChange, { intervalMs: 1000, enabled: true, active });
  return null;
}

const flush = async () => { await act(async () => { await Promise.resolve(); await Promise.resolve(); }); };
const setVisibility = (state) => Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });

beforeEach(() => { jest.useFakeTimers(); setVisibility("visible"); });
afterEach(() => { jest.useRealTimers(); });

test("reloads only when the conversations' version moves", async () => {
  const versions = ["1.0.1", "1.0.1", "2.0.2", "2.1.2"];
  const pulse = jest.fn(() => Promise.resolve({ data: { version: versions.shift() || "2.1.2" } }));
  const onChange = jest.fn();
  render(<Probe pulse={pulse} onChange={onChange} />);
  await flush(); // first pulse only sets the baseline
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(1000); }); await flush(); // same version
  expect(onChange).not.toHaveBeenCalled();
  await act(async () => { jest.advanceTimersByTime(1000); }); await flush(); // a new message
  expect(onChange).toHaveBeenCalledTimes(1);
  await act(async () => { jest.advanceTimersByTime(1000); }); await flush(); // a message read
  expect(onChange).toHaveBeenCalledTimes(2);
});

test("asks nothing while the tab is hidden and checks at once on return", async () => {
  const pulse = jest.fn(() => Promise.resolve({ data: { version: "1.0.1" } }));
  render(<Probe pulse={pulse} onChange={jest.fn()} />);
  await flush();
  expect(pulse).toHaveBeenCalledTimes(1);
  setVisibility("hidden");
  await act(async () => { jest.advanceTimersByTime(5000); }); await flush();
  expect(pulse).toHaveBeenCalledTimes(1);
  setVisibility("visible");
  await act(async () => { document.dispatchEvent(new Event("visibilitychange")); }); await flush();
  expect(pulse).toHaveBeenCalledTimes(2);
});

test("waits while not active (e.g. the college is not known yet)", async () => {
  const pulse = jest.fn(() => Promise.resolve({ data: { version: "1" } }));
  render(<Probe pulse={pulse} onChange={jest.fn()} active={false} />);
  await act(async () => { jest.advanceTimersByTime(5000); }); await flush();
  expect(pulse).not.toHaveBeenCalled();
});
