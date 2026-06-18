import Link from "next/link";
import { OpenSignInButton } from "../components/OpenSignInButton";
import { SignInModal } from "../components/SignInModal";

/**
 * 行銷首頁。結構借鑒典型 app 產品頁(導覽 → Hero → 功能 → 運作 → 理念 → CTA),
 * 但視覺一律走產品本身的 Stardew 暖棕像素風(沿用 ui-web 的 --wd-* tokens)。
 * 純靜態,維持 server component。文案語氣:溫暖、平靜、不用驚嘆號。
 */

const FEATURES = [
  {
    icon: "🗒️",
    title: "A few promises, not a backlog",
    body: "Commit to a small handful of tasks for today. WarmDock docks quietly on the right edge, out of your way until you need it.",
  },
  {
    icon: "🔒",
    title: "Finish-only tasks",
    body: "Once a task is created it can't be edited or deleted — only finished. No endless reshuffling. You either let it go, or you do it.",
  },
  {
    icon: "✨",
    title: "Points & a warm streak",
    body: "Completing tasks earns points and keeps your streak warm. Mark a task as Focus for a little extra. Momentum you can feel.",
  },
  {
    icon: "🌳",
    title: "An ability tree",
    body: "Spend points to unlock capacity, focus, rhythm and analysis abilities — shaping the dock to the way you actually work.",
  },
  {
    icon: "🌙",
    title: "A quiet closing ceremony",
    body: "When the day's promises are kept, WarmDock closes the day gently. No guilt, no red badges — just rest, and see you tomorrow.",
  },
  {
    icon: "🖥️",
    title: "Web, desktop & mobile",
    body: "One account, one warm dock, everywhere. Your day stays in sync across the browser, your desktop, and your phone.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Commit",
    body: "Drop in the few things that matter today.",
  },
  {
    n: "02",
    title: "Set the weight",
    body: "Mark each task easy, medium or hard — and Focus if it counts.",
  },
  {
    n: "03",
    title: "Finish",
    body: "Check them off one by one. Earn points, warm the streak.",
  },
  {
    n: "04",
    title: "Settle",
    body: "At day's reset, WarmDock tallies the day and lets it close.",
  },
];

const TREE = [
  { label: "Capacity", note: "more task slots" },
  { label: "Focus", note: "deeper single-task modes" },
  { label: "Rhythm", note: "your own daily reset" },
  { label: "Analysis", note: "see how your week flows" },
];

export default function Home() {
  return (
    <div className="wd-landing">
      {/* ── Nav ── */}
      <header className="wd-nav">
        <span className="wd-nav-brand">WarmDock</span>
        <nav className="wd-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#philosophy">Philosophy</a>
        </nav>
        <div className="wd-nav-cta">
          <Link className="wd-btn" href="/demo">
            Try the demo
          </Link>
          <OpenSignInButton className="wd-btn ghost">Sign in</OpenSignInButton>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="wd-hero">
        <div className="wd-hero-copy">
          <p className="wd-eyebrow">A right-side todo assistant</p>
          <h1>
            Finish what matters
            <br />
            today — and rest.
          </h1>
          <p className="wd-lede">
            WarmDock is a minimalist dock that lives on the right of your screen. Commit
            to a few tasks, complete them, and keep your streak warm.
          </p>
          <p className="wd-sub">
            Tasks can&apos;t be edited or deleted once created — only finished. Earn points,
            build a streak, and unlock more of the dock over time.
          </p>
          <div className="wd-cta-row">
            <Link className="wd-btn lg" href="/demo">
              Try the demo
            </Link>
            <OpenSignInButton className="wd-btn lg ghost">
              Sign in
            </OpenSignInButton>
          </div>
        </div>

        {/* 產品面板 mock —— 直接讓人看到 app 長相 */}
        <div className="wd-hero-art" aria-hidden="true">
          <div className="wd-mock">
            <div className="wd-mock-head">
              <span>What matters today?</span>
              <span className="wd-mock-streak">🔥 6 days</span>
            </div>
            <ul className="wd-mock-tasks">
              <li className="done">
                <span className="box">✓</span>
                <span>Send the project proposal</span>
              </li>
              <li>
                <span className="box" />
                <span>Practice piano, 20 min</span>
                <span className="band">Medium</span>
              </li>
              <li>
                <span className="box" />
                <span>Clear the inbox</span>
                <span className="band focus">Focus</span>
              </li>
              <li className="empty">
                <span className="box" />
                <span>+ Add a task…</span>
              </li>
            </ul>
            <div className="wd-mock-foot">
              <span>+4 points</span>
              <span>7:42 left</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="wd-section">
        <p className="wd-eyebrow center">Everything in one warm dock</p>
        <h2 className="wd-section-title">Small by design, kind by default</h2>
        <div className="wd-features">
          {FEATURES.map((f) => (
            <article key={f.title} className="wd-feature">
              <span className="wd-feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="wd-section alt">
        <p className="wd-eyebrow center">A single, gentle loop</p>
        <h2 className="wd-section-title">How a day works</h2>
        <ol className="wd-steps">
          {STEPS.map((s) => (
            <li key={s.n} className="wd-step">
              <span className="wd-step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Ability tree ── */}
      <section className="wd-section">
        <div className="wd-tree-wrap">
          <div className="wd-tree-copy">
            <p className="wd-eyebrow">Grow the dock</p>
            <h2 className="wd-section-title left">Unlock abilities at your own pace</h2>
            <p className="wd-section-lede">
              Points aren&apos;t just a score. Spend them on an ability tree that reshapes
              WarmDock around how you work — more room when you need it, deeper focus when
              you want it.
            </p>
          </div>
          <ul className="wd-tree">
            {TREE.map((t) => (
              <li key={t.label} className="wd-tree-node">
                <span className="wd-tree-dot" />
                <div>
                  <strong>{t.label}</strong>
                  <span>{t.note}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Philosophy ── */}
      <section id="philosophy" className="wd-philosophy">
        <p className="wd-eyebrow center">Why it&apos;s built this way</p>
        <blockquote>
          “A commitment isn&apos;t a list — it&apos;s a choice.”
        </blockquote>
        <p className="wd-philosophy-body">
          Most todo apps reward you for adding more. WarmDock does the opposite. By making
          tasks impossible to edit away, and by closing each day on purpose, it asks for a
          little honesty and gives back a little calm. You don&apos;t have to carry it all.
          Take it one at a time.
        </p>
      </section>

      {/* ── Final CTA ── */}
      <section className="wd-final">
        <div className="wd-final-card">
          <h2>Start today</h2>
          <p>No setup, no sign-up needed to look around. The demo runs entirely on your device.</p>
          <div className="wd-cta-row center">
            <Link className="wd-btn lg" href="/demo">
              Try the demo
            </Link>
            <OpenSignInButton className="wd-btn lg ghost">
              Sign in
            </OpenSignInButton>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="wd-foot">
        <span className="wd-foot-brand">WarmDock</span>
        <span className="wd-foot-mantra">There&apos;s still time, even slowly.</span>
      </footer>

      {/* Hero / Final CTA 的 Sign in 開的置中 modal(掛一次) */}
      <SignInModal />
    </div>
  );
}
