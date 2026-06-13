"use client";

import dynamic from "next/dynamic";

const DemoPanel = dynamic(() => import("../../components/DemoPanel").then((m) => m.DemoPanel), {
  ssr: false,
  loading: () => <p className="wd-web-status">Loading demo…</p>,
});

export default function DemoPage() {
  return <DemoPanel />;
}
