import { Component, useEffect, useRef, useState } from "react";

// The 42LMS robot leaning on the sign-in card (src/loginPages/Login.js). It reacts to what the person is doing:
//  - wave:  waves hello when the page opens, and whenever the mouse is on it
//  - idle:  leans on the card, blinks, eyes follow the mouse
//  - watch: a phone/email field is focused; its eyes follow the text as it is typed
//  - shy:   the code field is focused; it covers its eyes ("not peeking")
//  - oops:  a sign-in error was shown; a small sympathetic tilt
//  - happy: signed in; a wave
// Login.js tells it about errors and success with a "ln2-robot" window event; focus and typing it reads itself.
// Guidance: any element on the page with a data-robot-tip attribute (the tabs, fields, buttons, links, the logo) makes it
// say that tip while the mouse is on it or it has keyboard focus, and it looks towards it.
// Decorative only: aria-hidden; only its drawn shape takes the mouse (to wave); still for prefers-reduced-motion.
// On narrow screens only its head peeks over the top of the card.

const LINES = {
  wave: "Hi there! Welcome to 42LMS.",
  idle: "Hi there! Welcome to 42LMS.",
  watch: "Go ahead, I'm listening.",
  shy: "Not peeking!",
  oops: "Hmm, let's try that again.",
  happy: "You're in!",
};

const isCodeField = (el) =>
  el?.classList?.contains("ln2-input--otp") || el?.getAttribute?.("autocomplete") === "one-time-code";

// On a college's own address the robot welcomes people to the college, not to "42LMS": recruiters and students sign in to their
// college (UX audit, 19 Oct 2026).
const welcome = (collegeName) => (collegeName ? `Hi there! Welcome to ${collegeName}.` : LINES.wave);

function Robot({ collegeName }) {
  const ref = useRef(null);
  const [focus, setFocus] = useState(null); // null | "field" | "code"
  const [flash, setFlash] = useState(null); // null | "oops" | "happy"
  const [typed, setTyped] = useState(0);
  const [greeting, setGreeting] = useState(true); // the hello wave when the page opens
  const [hovered, setHovered] = useState(false);
  const [hoverTip, setHoverTip] = useState(null); // { text, el } under the mouse
  const [focusTip, setFocusTip] = useState(null); // { text, el } with keyboard focus

  const mood = flash || (focus === "code" ? "shy" : greeting || hovered ? "wave" : focus === "field" ? "watch" : "idle");

  useEffect(() => {
    const t = window.setTimeout(() => setGreeting(false), 2200);
    return () => window.clearTimeout(t);
  }, []);

  // Focus and typing inside the card.
  useEffect(() => {
    const inCard = (el) => el?.closest?.(".ln2-card") && el.tagName === "INPUT";
    const onIn = (e) => {
      if (!inCard(e.target)) return;
      setFocus(isCodeField(e.target) ? "code" : "field");
      setTyped(String(e.target.value || "").length);
    };
    const onOut = (e) => {
      if (inCard(e.target)) setFocus(null);
    };
    const onInput = (e) => {
      if (inCard(e.target)) setTyped(String(e.target.value || "").length);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    document.addEventListener("input", onInput);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
      document.removeEventListener("input", onInput);
    };
  }, []);

  // Guidance tips: data-robot-tip under the mouse, or on the focused element.
  useEffect(() => {
    const tipOf = (target) => {
      const el = target?.closest?.("[data-robot-tip]");
      return el && el.closest(".ln2") ? { text: el.getAttribute("data-robot-tip"), el } : null;
    };
    const onOver = (e) => {
      const t = tipOf(e.target);
      setHoverTip((prev) => (prev?.el === t?.el && prev?.text === t?.text ? prev : t));
    };
    const onLeavePage = () => setHoverTip(null);
    const onFocus = (e) => setFocusTip(tipOf(e.target));
    const onBlur = () => setFocusTip(null);
    document.addEventListener("mouseover", onOver);
    document.documentElement.addEventListener("mouseleave", onLeavePage);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("mouseover", onOver);
      document.documentElement.removeEventListener("mouseleave", onLeavePage);
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  // Errors and success, from Login.js.
  useEffect(() => {
    let timer = 0;
    const onRobot = (e) => {
      const next = e.detail;
      if (next !== "oops" && next !== "happy") return;
      window.clearTimeout(timer);
      setFlash(next);
      if (next === "oops") timer = window.setTimeout(() => setFlash(null), 2400);
    };
    window.addEventListener("ln2-robot", onRobot);
    return () => {
      window.removeEventListener("ln2-robot", onRobot);
      window.clearTimeout(timer);
    };
  }, []);

  // A tip counts only while its element is still on the page (the account list, for one, disappears), and says the
  // element's current text (Resend's tip changes when its countdown ends).
  const live = (tip) => (tip?.el?.isConnected ? { el: tip.el, text: tip.el.getAttribute("data-robot-tip") || tip.text } : null);
  const activeTip = live(hoverTip) || live(focusTip);
  const line = flash ? LINES[flash] : hovered ? welcome(collegeName) : activeTip?.text || (mood === "wave" || mood === "idle" ? welcome(collegeName) : LINES[mood]);

  // Eyes: look at what a tip is about, follow the text while typing, the mouse while idle.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (activeTip?.el && mood !== "shy" && mood !== "happy") {
      const box = el.getBoundingClientRect();
      const t = activeTip.el.getBoundingClientRect();
      const dx = t.left + t.width / 2 - (box.left + box.width * 0.6);
      const dy = t.top + t.height / 2 - (box.top + box.height * 0.33);
      const d = Math.max(1, Math.hypot(dx, dy));
      el.style.setProperty("--ln2-ex", `${((dx / d) * 4.5).toFixed(2)}px`);
      el.style.setProperty("--ln2-ey", `${((dy / d) * 3).toFixed(2)}px`);
      return undefined;
    }
    if (mood === "watch") {
      // The field is to the robot's left and a little lower; the caret moves towards it as the text grows.
      const x = -4.5 + Math.min(typed, 28) / 28 * 5;
      el.style.setProperty("--ln2-ex", `${x.toFixed(2)}px`);
      el.style.setProperty("--ln2-ey", "2.5px");
      return undefined;
    }
    el.style.setProperty("--ln2-ex", "0px");
    el.style.setProperty("--ln2-ey", "0px");
    if (mood !== "idle" || typeof window === "undefined") return undefined;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia?.("(pointer: fine)").matches;
    if (reduce || !fine) return undefined;
    const onMove = (e) => {
      const box = el.getBoundingClientRect();
      const cx = box.left + box.width * 0.7;
      const cy = box.top + box.height * 0.33;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const d = Math.max(1, Math.hypot(dx, dy));
      el.style.setProperty("--ln2-ex", `${((dx / d) * 4).toFixed(2)}px`);
      el.style.setProperty("--ln2-ey", `${((dy / d) * 3).toFixed(2)}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [mood, typed, activeTip?.el, activeTip?.text]);

  return (
    <div ref={ref} className={`ln2-robot ln2-robot--${mood}`} aria-hidden="true">
      <div key={line} className="ln2-robot__bubble">{line}</div>
      <svg className="ln2-robot__svg" viewBox="0 0 232 262" focusable="false"
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
        {/* The hover area: a still, invisible box around the robot. The waving arm itself never takes the mouse; when it did,
            the arm moved out from under the pointer, the wave stopped, the arm came back, and it jittered. */}
        <rect x="86" y="14" width="126" height="246" className="ln2-robot__hit" />
        <defs>
          <linearGradient id="ln2r-shell" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#eef3f8" />
          </linearGradient>
          <radialGradient id="ln2r-glow" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#7af0f2" />
            <stop offset="1" stopColor="#14a3b0" />
          </radialGradient>
        </defs>

        <ellipse className="ln2-robot__shadow" cx="142" cy="254" rx="42" ry="6" />

        {/* The whole robot leans a little towards the card. */}
        <g className="ln2-robot__body">
          {/* legs */}
          <rect x="120" y="204" width="15" height="38" rx="7.5" className="ln2-robot__limb" />
          <rect x="147" y="204" width="15" height="38" rx="7.5" className="ln2-robot__limb" />
          <rect x="113" y="236" width="26" height="12" rx="6" className="ln2-robot__dark" />
          <rect x="143" y="236" width="26" height="12" rx="6" className="ln2-robot__dark" />

          {/* the arm resting on the card */}
          <path d="M114 150 Q 78 170 34 152" className="ln2-robot__arm-line" />
          <path d="M114 150 Q 78 170 34 152" className="ln2-robot__arm-fill" />
          <circle cx="30" cy="151" r="10" className="ln2-robot__hand" />

          {/* torso */}
          <rect x="108" y="128" width="66" height="84" rx="24" fill="url(#ln2r-shell)" className="ln2-robot__shell" />
          <rect x="125" y="150" width="32" height="22" rx="8" className="ln2-robot__panel" />
          <circle cx="141" cy="161" r="4.5" fill="url(#ln2r-glow)" className="ln2-robot__heart" />
          <rect x="132" y="116" width="18" height="14" rx="4" className="ln2-robot__dark" />

          {/* head */}
          <g className="ln2-robot__head">
            <line x1="141" y1="54" x2="141" y2="38" className="ln2-robot__antenna" />
            <circle cx="141" cy="33" r="5.5" className="ln2-robot__bulb" />
            <circle cx="95" cy="88" r="6.5" className="ln2-robot__ear" />
            <circle cx="187" cy="88" r="6.5" className="ln2-robot__ear" />
            <rect x="97" y="52" width="88" height="70" rx="28" fill="url(#ln2r-shell)" className="ln2-robot__shell" />
            <rect x="107" y="66" width="68" height="42" rx="18" className="ln2-robot__visor" />

            <g className="ln2-robot__eyes">
              {/* open (idle / watch) */}
              <g className="ln2-robot__eye-open">
                <rect x="124" y="79" width="11" height="16" rx="5.5" />
                <rect x="148" y="79" width="11" height="16" rx="5.5" />
              </g>
              {/* closed arcs (shy) and smiling arcs (happy) */}
              <g className="ln2-robot__eye-closed">
                <path d="M123 88 q6 5 12 0" />
                <path d="M147 88 q6 5 12 0" />
              </g>
              <g className="ln2-robot__eye-happy">
                <path d="M123 90 q6 -8 12 0" />
                <path d="M147 90 q6 -8 12 0" />
              </g>
              {/* sad (oops) */}
              <g className="ln2-robot__eye-sad">
                <path d="M123 87 l12 -4 v10 a3 3 0 0 1 -3 3 h-6 a3 3 0 0 1 -3 -3z" />
                <path d="M159 87 l-12 -4 v10 a3 3 0 0 0 3 3 h6 a3 3 0 0 0 3 -3z" />
              </g>
            </g>
            <ellipse cx="117" cy="101" rx="5" ry="2.5" className="ln2-robot__blush" />
            <ellipse cx="165" cy="101" rx="5" ry="2.5" className="ln2-robot__blush" />
          </g>

          {/* the free arm: hangs, covers the eyes (shy) or waves (happy) */}
          <g className="ln2-robot__free-arm">
            <path d="M168 146 Q 180 172 182 196" className="ln2-robot__arm-line" />
            <path d="M168 146 Q 180 172 182 196" className="ln2-robot__arm-fill" />
            <circle cx="182" cy="200" r="10.5" className="ln2-robot__hand" />
          </g>
        </g>
      </svg>
    </div>
  );
}

/**
 * The robot is decoration: if it ever throws, it disappears and the sign-in page carries on (an error inside it would
 * otherwise take the whole page down with it).
 */
class RobotGuard extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (typeof console !== "undefined") console.warn("Login robot hidden after an error:", error?.message || error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function LoginRobot({ collegeName } = {}) {
  return (
    <RobotGuard>
      <Robot collegeName={collegeName} />
    </RobotGuard>
  );
}
