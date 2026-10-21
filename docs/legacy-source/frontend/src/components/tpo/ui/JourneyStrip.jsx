import { RightOutlined } from "@ant-design/icons";

const plural = (n, one, many) => `${Number(n).toLocaleString()} ${Number(n) === 1 ? one : many}`;

/**
 * The journey strip every best-version page uses (same look as Students and the batch page): steps that nest, the work between
 * two steps as a clickable gap, a row of links beside it, and a caption that says what it counts. Only what is picked is
 * highlighted; a second click on the same thing clears it (the page decides, through onPick).
 *
 * Props: caption, steps [{ key, label, n, all? (the first, "everyone" step: never highlighted, its click clears), reached? (how many
 *        ever got this far, shown when more than are there now) }],
 *        gaps { [stepKey]: { key, label, n } } (the gap after that step), extras [{ key, label, n }], picked, onPick(key),
 *        narrowedBy (other filters narrowing the list below), testid.
 */
export default function JourneyStrip({ caption, steps = [], gaps = {}, extras = [], picked, onPick, narrowedBy = 0, testid = "journey" }) {
  const base = steps[0]?.n || 0;
  const pct = (n) => (base ? Math.round((n * 100) / base) : 0);
  const shownExtras = extras.filter((e) => e.n > 0 || picked === e.key);
  return (
    <div className="tpo-journey-wrap" data-testid={`${testid}-wrap`}>
      {caption && (
        <div className="tpo-journey__caption" data-testid={`${testid}.caption`}>
          {caption}
          {narrowedBy > 0 && <span className="tpo-journey__narrowed"> · the list below is narrowed by {plural(narrowedBy, "more filter", "more filters")}</span>}
        </div>
      )}
      <div className="tpo-journey" role="group" aria-label={caption || "Journey"} data-testid={testid}>
        {steps.map((s, i) => {
          const gap = gaps[s.key];
          const on = !s.all && picked === s.key;
          return (
            <div key={s.key} className="tpo-journey__part">
              <button type="button" className={`tpo-journey__step${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => onPick(s.key)} data-testid={`${testid}.${s.key}`}
                title={s.all ? "Show everyone (clears what is picked here)" : `Show the ${s.n} who reached ${s.label}`}>
                <span className="tpo-journey__n">{Number(s.n).toLocaleString()}</span>
                <span className="tpo-journey__label">{s.label}</span>
                {i > 0 && <span className="tpo-journey__pct">{pct(s.n)}% of {base.toLocaleString()}</span>}
                {s.reached > s.n && <span className="tpo-journey__reached">{Number(s.reached).toLocaleString()} got this far</span>}
              </button>
              {i < steps.length - 1 && (
                <div className="tpo-journey__between">
                  <RightOutlined className="tpo-journey__arrow" aria-hidden />
                  {gap && gap.n > 0 && (
                    <button type="button" className={`tpo-journey__gap${picked === gap.key ? " is-on" : ""}`} aria-pressed={picked === gap.key}
                      onClick={() => onPick(gap.key)} data-testid={`${testid}.${gap.key}`} title={`Show these ${gap.n}`}>
                      {Number(gap.n).toLocaleString()} {String(gap.label).toLowerCase()}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {shownExtras.length > 0 && (
        <div className="tpo-journey__extras">
          {shownExtras.map((e) => (
            <button type="button" key={e.key} className={`tpo-journey__extra${picked === e.key ? " is-on" : ""}`} aria-pressed={picked === e.key}
              onClick={() => onPick(e.key)} data-testid={`${testid}.${e.key}`}>
              {e.label} · <strong>{Number(e.n).toLocaleString()}</strong>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
