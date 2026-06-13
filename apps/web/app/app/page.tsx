"use client";

import dynamic from "next/dynamic";

const AppPanel = dynamic(() => import("../../components/AppPanel").then((m) => m.AppPanel), {
  ssr: false,
  loading: () => <p className="wd-web-status">Loading…</p>,
});

export default function AppPage() {
  return <AppPanel />;
}
