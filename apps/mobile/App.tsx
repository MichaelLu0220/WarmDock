import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { configureGateways } from "@warmdock/app";
import { getClient } from "./src/client";
import { SignIn } from "./src/screens/SignIn";
import { Today } from "./src/screens/Today";

// wire the cloud client into the shared app layer once
const client = getClient();
configureGateways(client);

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    void client.auth.getSession().then(setSession);
    const unsubscribe = client.auth.onAuthStateChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  if (session === undefined) return null;
  return session ? <Today userId={session.user.id} /> : <SignIn />;
}
