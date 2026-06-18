"use client";

/**
 * 頁面中段(Hero / Final CTA)的 Sign in 按鈕:派發事件開啟「置中 modal」字卡。
 * 與 SignInModal 透過 'wd-open-signin-modal' 事件解耦(刻意不碰 nav 的下拉)。
 */
export function OpenSignInButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event("wd-open-signin-modal"))}
    >
      {children}
    </button>
  );
}
