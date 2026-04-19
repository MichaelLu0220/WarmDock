import { useCallback, useEffect, useRef, useState } from "react";

type Options = {
  durationMs: number;
  onComplete: () => void;
  enabled?: boolean;
};

/**
 * 按住觸發 hook。
 *
 * 用法:
 *   const { progress, isHolding, handlers } = useHoldToActivate({
 *     durationMs: 2000,
 *     onComplete: () => console.log("done"),
 *     enabled: true,
 *   });
 *
 * 把 handlers 展開到目標元素(或 SVG <g>),就會:
 *   - mousedown 開始計時、每幀更新 progress (0~1)
 *   - 滿了自動呼叫 onComplete,progress 瞬間清空
 *   - 中途 mouseup/mouseleave 觸發回縮(200ms 內 progress → 0)
 *   - enabled=false 時按下去無反應
 *
 * 注意:progress 的更新用 rAF,不會觸發多餘 re-render(但仍會 re-render)。
 * 若要避免頻繁 re-render,可把 progress 外部用 ref 讀。這裡為了簡單直接走 state。
 */
export function useHoldToActivate(options: Options) {
  const { durationMs, onComplete, enabled = true } = options;

  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);

  const holdStartRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const releasingRef = useRef(false);
  const releaseStartRef = useRef<number | null>(null);
  const releaseFromRef = useRef(0);
  const completedRef = useRef(false);

  // 取最新 onComplete,避免 rAF 裡吃到舊的
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const cancelRaf = () => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const reset = useCallback(() => {
    cancelRaf();
    holdStartRef.current = null;
    releasingRef.current = false;
    releaseStartRef.current = null;
    releaseFromRef.current = 0;
    completedRef.current = false;
    setIsHolding(false);
    setProgress(0);
  }, []);

  // 組件卸載時清計時器
  useEffect(() => {
    return () => {
      cancelRaf();
    };
  }, []);

  const tick = useCallback(
    (now: number) => {
      // 回縮階段
      if (releasingRef.current) {
        if (releaseStartRef.current == null) {
          releaseStartRef.current = now;
        }
        const releaseElapsed = now - releaseStartRef.current;
        const RELEASE_MS = 200;
        const p =
          releaseFromRef.current *
          Math.max(0, 1 - releaseElapsed / RELEASE_MS);
        setProgress(p);

        if (releaseElapsed >= RELEASE_MS) {
          reset();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      // 前進階段
      if (holdStartRef.current == null) {
        holdStartRef.current = now;
      }
      const elapsed = now - holdStartRef.current;
      const p = Math.min(1, elapsed / durationMs);
      setProgress(p);

      if (p >= 1 && !completedRef.current) {
        completedRef.current = true;
        cancelRaf();
        // 下一幀再清,讓 UI 有機會畫到滿的那一幀
        requestAnimationFrame(() => {
          onCompleteRef.current();
          reset();
        });
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [durationMs, reset]
  );

  const startHold = useCallback(() => {
    if (!enabled) return;
    if (isHolding) return;
    cancelRaf();
    holdStartRef.current = null;
    releasingRef.current = false;
    completedRef.current = false;
    setIsHolding(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [enabled, isHolding, tick]);

  const releaseHold = useCallback(() => {
    if (!isHolding) return;
    // 已完成就不走回縮
    if (completedRef.current) return;
    setIsHolding(false);
    // 切到回縮階段,沿用 tick 的 rAF
    releasingRef.current = true;
    releaseStartRef.current = null;
    releaseFromRef.current = progress;
    cancelRaf();
    rafRef.current = requestAnimationFrame(tick);
  }, [isHolding, progress, tick]);

  const handlers = {
    onMouseDown: (e: React.MouseEvent) => {
      // 只收左鍵
      if (e.button !== 0) return;
      startHold();
    },
    onMouseUp: () => releaseHold(),
    onMouseLeave: () => releaseHold(),
    // 觸控裝置(未來擴充,不影響目前行為)
    onTouchStart: () => startHold(),
    onTouchEnd: () => releaseHold(),
    onTouchCancel: () => releaseHold(),
  };

  return {
    progress,
    isHolding,
    handlers,
    reset,
  };
}