"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSessionStore } from "@warmdock/ui-web";

/**
 * Demo 專用「翻書」轉場(縮放 morph 版)。
 *
 * app 一律呈現「書的左半頁」——裝訂(書脊)在右緣。切換時:
 *   往前(完成所有任務 → 結算):左頁縮到螢幕中央成小書 →
 *     一疊頁從右脊接力往左翻入覆蓋 → 放大成結算左頁。
 *   往回(結算「看任務」→ 任務):反向,頁往右掀回、書再放大回任務頁。
 *
 * 做法:在共用 <Panel/> 卡片上疊一層 3D 書(fixed),底下實際內容
 * 已瞬切並被書蓋住(整張卡 visibility:hidden),翻完才顯露新頁。
 * 容器的「source→中央→dest」位移/縮放用 WAAPI(rect 是動態的),
 * 每頁的翻動用 CSS(stagger delay)。只在 .wd-demo,正式 app 維持瞬切。
 *
 * 時間軸常數需與 globals.css 的 keyframes / --fb-dur 對齊。
 */
const PAGE_COUNT = 6;
const STAGGER = 72; // 每頁起翻間隔 (ms)
const PAGE_DUR = 420; // 單頁翻動時長 (ms) — 同步 CSS --fb-dur
const TOTAL = 1300; // 整段轉場時長 (ms)
// 翻頁很早就開始,與容器變形「重疊」進行(不等變形做完才翻 → 更連貫絲滑)
const PAGE_START = Math.round(TOTAL * 0.1);
// 容器就地輕縮的「谷底」位置與幅度(一條連續曲線 source→dip→dest,無停頓)
const DIP_AT = 0.34;
const DIP_SCALE = 0.94;
// 目標頁內容在翻書尾段就疊上來淡入(不是翻完才出現)
const REVEAL_START = Math.round(TOTAL * 0.6);
const REVEAL = 380; // 內容淡入 (ms) — 同步 CSS wd-fb-reveal-*

type Geo = { left: number; top: number; width: number; height: number };
type Anim = { dir: "fwd" | "back"; src: Geo; dest: Geo; id: number };

const CARD = ".wd-demo .wd-panel.wd-card";

function measure(el: Element): Geo {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

/** 書頁上的淡淡內容:像一頁日常任務(標題列 + 幾條打勾任務),翻動時不再空白。 */
function FaceMock() {
  return (
    <div className="wd-flipbook__mock" aria-hidden>
      <div className="wd-flipbook__mock-head" />
      <div className="wd-flipbook__mock-row is-done">
        <i />
        <span />
      </div>
      <div className="wd-flipbook__mock-row is-done">
        <i />
        <span />
      </div>
      <div className="wd-flipbook__mock-row">
        <i />
        <span />
      </div>
    </div>
  );
}

export function DemoBookFlip() {
  const allDone = useSessionStore((s) => s.allTasksCompleted);
  const prevRef = useRef(allDone);
  const lastRect = useRef<Geo | null>(null);
  const idRef = useRef(0);
  const timers = useRef<number[]>([]);
  const bookRef = useRef<HTMLDivElement | null>(null);
  const [anim, setAnim] = useState<Anim | null>(null);

  // 偵測 all-complete 切換:在繪製前疊書、藏卡(避免新頁先閃一格)。
  useLayoutEffect(() => {
    if (allDone === prevRef.current) return;
    const dir: "fwd" | "back" = allDone ? "fwd" : "back";
    prevRef.current = allDone;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const card = document.querySelector<HTMLElement>(CARD);
    if (!card) return;
    const dest = measure(card);
    const src = lastRect.current ?? dest; // 上一個 commit 記下的尺寸 = 來源頁
    lastRect.current = dest;

    card.classList.add("wd-card--flipping");
    const id = ++idRef.current;
    setAnim({ dir, src, dest, id });

    timers.current.forEach(clearTimeout);
    timers.current = [
      // 翻書尾段:卡片(目標頁內容)疊到書「上面」淡入,書仍在後面收尾。
      window.setTimeout(() => {
        card.classList.remove("wd-card--flipping");
        card.classList.add("wd-card--flip-reveal");
      }, REVEAL_START),
      // 收掉書
      window.setTimeout(() => {
        setAnim(null);
      }, TOTAL + 40),
      window.setTimeout(() => {
        card.classList.remove("wd-card--flip-reveal");
      }, TOTAL + 40 + REVEAL),
    ];
  }, [allDone]);

  // 每個 commit 記下卡片尺寸,供下次切換取得 source rect。
  useLayoutEffect(() => {
    const card = document.querySelector(CARD);
    if (card) lastRect.current = measure(card);
  });

  // 容器 morph:source → 就地輕縮谷底 → dest,一條連續曲線(無停頓平台),
  // 留在右邊邊;書頁折到右側超出畫面邊界沒關係。rect 動態,用 WAAPI。
  useLayoutEffect(() => {
    const el = bookRef.current;
    if (!anim || !el) return;
    const { src, dest } = anim;
    const tf = (g: Geo) =>
      `translate(${g.left - dest.left}px, ${g.top - dest.top}px) scale(${
        g.width / dest.width
      }, ${g.height / dest.height})`;

    const dw = dest.width * DIP_SCALE;
    const dh = dest.height * DIP_SCALE;
    const dip: Geo = {
      left: dest.left + (dest.width - dw) / 2,
      top: dest.top + (dest.height - dh) / 2,
      width: dw,
      height: dh,
    };

    const a = el.animate(
      [
        // 每個關鍵格各自緩動,接成一條平滑的山谷(縮下去、再回到原尺寸)
        { transform: tf(src), offset: 0, easing: "cubic-bezier(0.33, 0, 0.2, 1)" },
        { transform: tf(dip), offset: DIP_AT, easing: "cubic-bezier(0.33, 0, 0.25, 1)" },
        { transform: "translate(0px,0px) scale(1,1)", offset: 1 },
      ],
      { duration: TOTAL, fill: "both" }
    );
    return () => a.cancel();
  }, [anim]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      document
        .querySelector(CARD)
        ?.classList.remove("wd-card--flipping", "wd-card--flip-reveal");
    },
    []
  );

  if (!anim) return null;
  const { dir, dest } = anim;

  return (
    <div
      key={anim.id}
      ref={bookRef}
      className="wd-flipbook"
      data-dir={dir}
      aria-hidden
      style={
        {
          left: dest.left,
          top: dest.top,
          width: dest.width,
          height: dest.height,
          "--fb-dur": `${PAGE_DUR}ms`,
        } as React.CSSProperties
      }
    >
      <div className="wd-flipbook__stage">
        <div className="wd-flipbook__base" />
        <div className="wd-flipbook__edge" />
        {Array.from({ length: PAGE_COUNT }).map((_, i) => {
          // 往前:由下往上接力翻入;往回:由上往下接力掀回。
          const order = dir === "fwd" ? i : PAGE_COUNT - 1 - i;
          const delay = `${PAGE_START + order * STAGGER}ms`;
          return (
            <div
              key={i}
              className="wd-flipbook__page"
              style={{ zIndex: i + 1, animationDelay: delay }}
            >
              <div className="wd-flipbook__face wd-flipbook__face--front">
                <FaceMock />
                <span className="wd-flipbook__shade" style={{ animationDelay: delay }} />
              </div>
              <div className="wd-flipbook__face wd-flipbook__face--back">
                <FaceMock />
                <span className="wd-flipbook__shade" style={{ animationDelay: delay }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
