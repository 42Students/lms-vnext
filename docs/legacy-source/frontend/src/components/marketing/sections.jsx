import Link from "next/link";
import s from "./marketing.module.scss";
import Icon from "./icons";
import {
  AGENTS,
  INTEGRATIONS,
  PILLARS,
  LIFECYCLE,
  UNIVERSITIES,
  ENTERPRISES,
} from "./data";

export function SectionHeading({ eyebrow, title, lede, left = false }) {
  return (
    <div className={left ? s.sectionHeadLeft : s.sectionHead}>
      {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
      <h2 className={s.sectionTitle}>{title}</h2>
      {lede && <p className={s.sectionLede}>{lede}</p>}
    </div>
  );
}

// Page hero carrying the single <h1> for the sub-pages (reuses hero styles).
export function PageHero({ eyebrow, title, lede }) {
  return (
    <section className={s.hero}>
      <div className={s.container}>
        <div style={{ padding: "48px 0 8px", maxWidth: 760 }}>
          {eyebrow && <span className={s.eyebrow}>{eyebrow}</span>}
          <h1 className={s.heroTitle} style={{ marginTop: 8 }}>{title}</h1>
          {lede && <p className={s.heroSub}>{lede}</p>}
        </div>
      </div>
    </section>
  );
}

export function Hero() {
  return (
    <section className={s.hero}>
      <div className={s.container}>
        <div className={s.heroInner}>
          <div>
            <span className={s.heroEyebrow}>
              <Icon name="spark" /> The AI Talent &amp; Workforce Operating System
            </span>
            <h1 className={s.heroTitle}>
              Build <span className={s.accent}>Employable Graduates</span>.<br />
              Create High-Performing Workforces.
            </h1>
            <p className={s.heroSub}>
              42 LMS is an autonomous AI platform that continuously understands how people learn,
              work, and perform — creating a unique development journey for every individual.
            </p>
            <div className={s.heroCtas}>
              <Link href="/request-demo" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
                Request a Demo <Icon name="arrow" />
              </Link>
              <Link href="/platform" className={`${s.btn} ${s.btnGhost} ${s.btnLg}`}>
                See how it works
              </Link>
            </div>
            <p className={s.heroTrust}>One platform for universities and enterprises.</p>
          </div>

          <div className={s.heroVisual} aria-hidden="true">
            <div className={s.heroVisualBar}>
              <span /> <span /> <span />
            </div>
            <div className={s.heroChips}>
              {AGENTS.slice(0, 4).map((a) => (
                <div key={a.name} className={s.heroChip}>
                  <Icon name={a.icon} />
                  {a.name.replace(" Agent", "")}
                </div>
              ))}
            </div>
            <div className={s.heroPulse}>
              <i /> Continuously assessing, coaching, and improving outcomes
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function Personalization() {
  return (
    <section className={`${s.section} ${s.sectionAlt}`}>
      <div className={s.container}>
        <div className={s.quote}>
          <span className={s.eyebrow}>Every individual is different</span>
          <p className={s.quoteBig}>Why should learning be the same?</p>
          <p className={s.sectionLede}>
            Most platforms deliver the same courses, pathways, and experience to everyone. 42 LMS
            learns from every interaction, assessment, project, and performance signal to create a
            personalized growth journey for each person.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AgentGrid({ eyebrow = "Meet your AI talent team", title = "Specialized AI agents that develop talent together", lede }) {
  return (
    <section className={s.section}>
      <div className={s.container}>
        <SectionHeading eyebrow={eyebrow} title={title} lede={lede} />
        <div className={`${s.grid} ${s.grid3}`}>
          {AGENTS.map((a) => (
            <article key={a.name} className={s.card}>
              <span className={s.cardIcon}><Icon name={a.icon} /></span>
              <h3 className={s.cardTitle}>{a.name}</h3>
              <p className={s.cardDesc}>{a.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function IntegrationsStrip() {
  return (
    <section className={`${s.section} ${s.sectionTint}`}>
      <div className={s.container}>
        <SectionHeading
          eyebrow="AI that understands talent"
          title="It learns from the signals that actually matter"
          lede="A living talent intelligence system that understands every individual, team, and organization."
        />
        <div className={s.chips}>
          {INTEGRATIONS.map((label) => (
            <span key={label} className={s.chip}>
              <i /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckList({ points }) {
  return (
    <ul className={s.checkList}>
      {points.map((p) => (
        <li key={p} className={s.checkItem}>
          <Icon name="check" /> <span>{p}</span>
        </li>
      ))}
    </ul>
  );
}

function Outcomes({ items }) {
  return (
    <ul className={s.outcomeList}>
      {items.map((o) => (
        <li key={o} className={s.outcomeItem}>{o}</li>
      ))}
    </ul>
  );
}

// Compact two-up split used on the Home page.
export function AudienceSplit() {
  return (
    <section className={s.section}>
      <div className={s.container}>
        <SectionHeading
          eyebrow="Who it's for"
          title="One platform. Two outcomes."
          lede="Whether you graduate students or grow a workforce, 42 LMS turns capability into performance."
        />
        <div className={s.audience}>
          <article className={s.audienceCard}>
            <span className={s.eyebrow}>{UNIVERSITIES.eyebrow}</span>
            <h3 className={s.audienceTitle}>{UNIVERSITIES.title}</h3>
            <CheckList points={UNIVERSITIES.points.slice(0, 3)} />
            <Outcomes items={UNIVERSITIES.outcomes} />
            <div style={{ marginTop: 18 }}>
              <Link href="/universities" className={`${s.btn} ${s.btnGhost}`}>
                For Universities <Icon name="arrow" />
              </Link>
            </div>
          </article>
          <article className={`${s.audienceCard} ${s.audienceCardDark}`}>
            <span className={s.eyebrow} style={{ color: "#9ee4e8" }}>{ENTERPRISES.eyebrow}</span>
            <h3 className={s.audienceTitle}>{ENTERPRISES.title}</h3>
            <CheckList points={ENTERPRISES.points.slice(0, 3)} />
            <Outcomes items={ENTERPRISES.outcomes} />
            <div style={{ marginTop: 18 }}>
              <Link href="/enterprises" className={`${s.btn} ${s.btnLight}`}>
                For Enterprises <Icon name="arrow" />
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}

// Full detail block used on the dedicated /universities and /enterprises pages.
export function AudienceDetail({ data }) {
  return (
    <section className={s.section}>
      <div className={s.container}>
        <SectionHeading eyebrow={data.eyebrow} title={data.title} left />
        <CheckList points={data.points} />
        <div style={{ marginTop: 8 }}>
          <span className={s.eyebrow}>Outcomes</span>
          <Outcomes items={data.outcomes} />
        </div>
      </div>
    </section>
  );
}

export function PlatformPillars() {
  return (
    <section className={`${s.section} ${s.sectionAlt}`}>
      <div className={s.container}>
        <SectionHeading
          eyebrow="One autonomous AI platform"
          title="Everything you need to develop talent"
        />
        <div className={`${s.grid} ${s.grid3}`}>
          {PILLARS.map((p) => (
            <article key={p.title} className={s.card}>
              <span className={s.cardIcon}><Icon name={p.icon} /></span>
              <h3 className={s.cardTitle}>{p.title}</h3>
              <p className={s.cardDesc}>{p.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LifecycleStrip() {
  return (
    <section className={s.section}>
      <div className={s.container}>
        <SectionHeading
          eyebrow="Autonomous talent development"
          title="Assess. Diagnose. Learn. Coach. Improve. Repeat."
          lede="42 LMS automates the entire talent-development lifecycle, so every outcome continuously improves."
        />
        <div className={s.lifecycle}>
          {LIFECYCLE.map((step, i) => (
            <span key={step} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <span className={s.lifeStep}>{step}</span>
              {i < LIFECYCLE.length - 1 && (
                <span className={s.lifeArrow}><Icon name="arrow" /></span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({
  title = "The future of learning is autonomous",
  sub = "Move beyond courses and compliance. Build a continuously improving talent ecosystem powered by AI.",
}) {
  return (
    <section className={s.section}>
      <div className={s.container}>
        <div className={s.ctaBand}>
          <h2 className={s.ctaTitle}>{title}</h2>
          <p className={s.ctaSub}>{sub}</p>
          <div className={s.ctaActions}>
            <Link href="/request-demo" className={`${s.btn} ${s.btnPrimary} ${s.btnLg}`}>
              Request a Demo <Icon name="arrow" />
            </Link>
            <Link href="/login" className={`${s.btn} ${s.btnLight} ${s.btnLg}`}>
              Login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
