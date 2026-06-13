import Link from "next/link";

export default function Home() {
  return (
    <main className="wd-web-home">
      <h1>WarmDock</h1>
      <p>
        A minimalist right-side todo assistant focused on helping you finish what matters
        today. Commit to a few tasks, complete them, and keep your streak warm.
      </p>
      <p>
        Tasks can&apos;t be edited or deleted once created — only finished. Earn points, build a
        streak, and unlock more slots over time.
      </p>
      <div className="wd-web-cta">
        <Link href="/demo">Try the demo</Link>
        <Link className="secondary" href="/sign-in">
          Sign in
        </Link>
      </div>
    </main>
  );
}
