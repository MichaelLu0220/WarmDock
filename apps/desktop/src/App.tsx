import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  configureCache,
  configureGateways,
  configurePlatformWindow,
  openPanel,
  Panel,
  useBootstrap,
} from "@warmdock/ui-web";
import { getClient } from "./lib/client";
import { createDesktopCache } from "./lib/cache";
import { desktopPlatformWindow } from "./app/platformWindow";
import { windowManager } from "./app/window/windowManager";
import { loadTriggerPositionY } from "./lib/triggerPosition";
import { useApplyTheme } from "./app/theme";
import { useAutoHide } from "./app/hooks/useAutoHide";
import { useReminders } from "./app/useReminders";
import { TriggerBubble } from "./ui/trigger/TriggerBubble";
import { ReminderOptIn } from "./ui/ReminderOptIn";
import { SignOutButton } from "./ui/SignOutButton";
import { SignIn } from "./ui/SignIn";

// wire the cloud client + desktop window adapter once
const client = getClient();
configureGateways(client);
configurePlatformWindow(desktopPlatformWindow);

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    void windowManager.init().then(() => windowManager.setAnchorFromRatio(loadTriggerPositionY()));
    void client.auth.getSession().then(setSession);
    const unsubscribe = client.auth.onAuthStateChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  if (session === undefined) return null;
  if (!session) return <SignInGate />;
  return <Authed userId={session.user.id} />;
}

function SignInGate() {
  useEffect(() => {
    void openPanel();
  }, []);
  return (
    <div className="wd-app">
      <div className="wd-panel wd-card" data-open="true">
        <SignIn />
      </div>
    </div>
  );
}

function Authed({ userId }: { userId: string }) {
  // configure the encrypted offline cache before bootstrap runs
  configureCache(createDesktopCache(userId));
  useBootstrap(userId);
  useApplyTheme();
  useAutoHide();
  useReminders();

  useEffect(() => {
    if (import.meta.env.DEV) void openPanel();
  }, []);

  return (
    <div className="wd-app">
      <TriggerBubble />
      <Panel />
      <SignOutButton />
      <ReminderOptIn />
    </div>
  );
}

export default App;
