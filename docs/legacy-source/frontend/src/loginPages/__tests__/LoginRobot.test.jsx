import { act, render } from "@testing-library/react";
import LoginRobot from "../LoginRobot";

// The robot on the sign-in card: moods from focus, errors and success; guidance tips from data-robot-tip.
const page = () =>
  render(
    <section className="ln2">
      <div className="ln2-card">
        <LoginRobot />
        <button type="button" data-robot-tip="Sign in with your email.">Email</button>
        <input id="email-input" />
        <input id="otp-input" className="ln2-input--otp" data-robot-tip="Type the code. I won't look!" />
      </div>
    </section>,
  );

const robot = (c) => c.querySelector(".ln2-robot");
const says = (c) => c.querySelector(".ln2-robot__bubble").textContent;

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test("waves hello, then settles and is hidden from screen readers", () => {
  const { container } = page();
  expect(robot(container).className).toContain("ln2-robot--wave");
  expect(robot(container).getAttribute("aria-hidden")).toBe("true");
  act(() => { jest.advanceTimersByTime(2300); });
  expect(robot(container).className).toContain("ln2-robot--idle");
  expect(says(container)).toBe("Hi there! Welcome to 42LMS.");
});

test("watches a field, covers its eyes on the code field", () => {
  const { container } = page();
  act(() => { jest.advanceTimersByTime(2300); });
  act(() => { container.querySelector("#email-input").focus(); });
  expect(robot(container).className).toContain("ln2-robot--watch");
  act(() => { container.querySelector("#otp-input").focus(); });
  expect(robot(container).className).toContain("ln2-robot--shy");
  expect(says(container)).toBe("Type the code. I won't look!");
});

test("an error makes it sorry for a moment; success makes it wave", () => {
  const { container } = page();
  act(() => { window.dispatchEvent(new CustomEvent("ln2-robot", { detail: "oops" })); });
  expect(robot(container).className).toContain("ln2-robot--oops");
  expect(says(container)).toBe("Hmm, let's try that again.");
  act(() => { jest.advanceTimersByTime(2500); });
  expect(robot(container).className).not.toContain("ln2-robot--oops");
  act(() => { window.dispatchEvent(new CustomEvent("ln2-robot", { detail: "happy" })); });
  expect(robot(container).className).toContain("ln2-robot--happy");
  expect(says(container)).toBe("You're in!");
});

test("says the tip of what the mouse is on, and drops it when that element goes away", () => {
  const { container } = page();
  act(() => { jest.advanceTimersByTime(2300); });
  const tab = container.querySelector("[data-robot-tip='Sign in with your email.']");
  act(() => { tab.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); });
  expect(says(container)).toBe("Sign in with your email.");
  // The tip follows the element's current text.
  act(() => { tab.setAttribute("data-robot-tip", "Email it is."); tab.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })); });
  expect(says(container)).toBe("Email it is.");
  act(() => { tab.remove(); });
  // Any re-render with the element gone: the tip is dropped (here focusing a field without a tip: "watch" line).
  act(() => { container.querySelector("#email-input").focus(); });
  expect(says(container)).toBe("Go ahead, I'm listening.");
  act(() => { container.querySelector("#email-input").blur(); });
  expect(says(container)).toBe("Hi there! Welcome to 42LMS.");
});

test("a crash inside the robot hides it instead of breaking the page", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  const original = window.addEventListener;
  // Make the robot's own setup throw.
  window.addEventListener = (type, ...rest) => {
    if (type === "ln2-robot") throw new Error("boom");
    return original.call(window, type, ...rest);
  };
  try {
    const { container } = render(<div className="ln2"><div className="ln2-card"><LoginRobot /><p>form</p></div></div>);
    expect(container.querySelector(".ln2-robot")).toBeNull();
    expect(container.textContent).toContain("form");
  } finally {
    window.addEventListener = original;
    spy.mockRestore();
    warn.mockRestore();
  }
});
