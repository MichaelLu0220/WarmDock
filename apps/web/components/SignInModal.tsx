"use client";

import { useEffect, useState } from "react";
import { SignInCard } from "./SignInCard";

/**
 * 置中彈出的登入 modal。在首頁掛載一次,由 nav / Hero / Final CTA 的 Sign in
 * 透過 'wd-open-signin-modal' 事件開啟。背景變暗,點背景或按 Esc 關閉。
 *
 * 鎖捲動只設 body overflow:hidden;背景不右移交給 CSS 的
 * `body { scrollbar-gutter: stable }`(永遠保留捲軸溝槽),不需 JS 補 padding。
 */
export function SignInModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    window.addEventListener("wd-open-signin-modal", openHandler);
    return () => window.removeEventListener("wd-open-signin-modal", openHandler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="wd-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Sign in"
      onClick={() => setOpen(false)}
    >
      <div className="wd-modal-card" onClick={(e) => e.stopPropagation()}>
        <SignInCard onClose={() => setOpen(false)} />
      </div>
    </div>
  );
}
