"use client";

import { useEffect, useRef, useState } from "react";
import { useDemoTour } from "./DemoTour";

/**
 * 左側的步驟引導字卡。翻動字卡(箭頭/圓點)會直接把右側 demo 切換到
 * 該步驟的場景(useDemoTour.jumpTo)—— 翻到第幾步,右側就跳到第幾步,
 * 方便反覆檢視各步的特效,不必每次從頭操作。
 */
export function DemoStepCards() {
  const { steps, index, jumpTo } = useDemoTour();
  const [dir, setDir] = useState<"next" | "prev">("next");
  const prevIndex = useRef(index);

  // 進度自動推進(完成任務)時,字卡的進場方向跟著走
  useEffect(() => {
    setDir(index >= prevIndex.current ? "next" : "prev");
    prevIndex.current = index;
  }, [index]);

  const step = steps[index];
  const atStart = index === 0;
  const atEnd = index === steps.length - 1;

  const go = (delta: number) => {
    const next = index + delta;
    if (next < 0 || next >= steps.length) return;
    setDir(delta > 0 ? "next" : "prev");
    jumpTo(next);
  };

  return (
    <div className="wd-stepcards">
      <div className="wd-stepcards-head">
        <span className="wd-stepcards-eyebrow">Guided tour</span>
        <span className="wd-stepcards-count">
          {index + 1} / {steps.length}
        </span>
      </div>

      <div className="wd-stepcard" key={index} data-dir={dir}>
        <span className="wd-stepcard-num">{String(index + 1).padStart(2, "0")}</span>
        <h2 className="wd-stepcard-title">{step.title}</h2>
        <p className="wd-stepcard-body">{step.body}</p>
        <span className="wd-stepcard-tag wd-stepcard-tag--now">You are here</span>
      </div>

      <div className="wd-stepcards-nav">
        <button
          type="button"
          className="wd-stepcards-arrow"
          onClick={() => go(-1)}
          disabled={atStart}
          aria-label="Previous step"
        >
          ‹
        </button>

        <div className="wd-stepcards-dots" role="tablist" aria-label="Tour steps">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`wd-stepdot ${i === index ? "is-view is-current" : ""} ${
                i < index ? "is-done" : ""
              }`}
              onClick={() => {
                setDir(i > index ? "next" : "prev");
                jumpTo(i);
              }}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-selected={i === index}
              role="tab"
            />
          ))}
        </div>

        <button
          type="button"
          className="wd-stepcards-arrow"
          onClick={() => go(1)}
          disabled={atEnd}
          aria-label="Next step"
        >
          ›
        </button>
      </div>
    </div>
  );
}
