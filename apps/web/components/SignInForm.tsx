import Link from "next/link";
import { SignInCard } from "./SignInCard";

/** /sign-in 整頁版:暖棕全頁外框 + 共用的 SignInCard。 */
export function SignInForm() {
  return (
    <main className="wd-auth">
      <Link className="wd-auth-back" href="/">
        ← Back
      </Link>

      <SignInCard />

      <p className="wd-auth-alt">
        Just looking? <Link href="/demo">Try the demo</Link>
      </p>
    </main>
  );
}
