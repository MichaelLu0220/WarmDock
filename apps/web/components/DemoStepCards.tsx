"use client";

import { useEffect, useState } from "react";
import { useDemoTour } from "./DemoTour";

/**
 * 左側的步驟引導字卡。卡片內容隨導覽進度(useDemoTour)自動切換,
 * 也可用左右箭頭翻看其他步驟的說明(預覽,不影響實際進度)。
 */
export function DemoStepCards() {
  const { steps, index } = useDemoTour();
  const [view, setView] = useState(index);
  const [dir, setDir] = useState<"next" | "prev">("next");

  // 進度自動推進時,字卡跟著切到當前步驟
  useEffect(() => {
    setDir("next");
    setView(index);
  }, [index]);

  const step = steps[view];
  const atStart = view === 0;
  const atEnd = view === steps.length - 1;

  const go = (delta: number) => {
    const next = view + delta;
    if (next < 0 || next >= steps.length) return;
    setDir(delta > 0 ? "next" : "prev");
    setView(next);
  };

  return (
    <div className="wd-stepcards">
      <div className="wd-stepcards-head">
        <span className="wd-stepcards-eyebrow">Guided tour</span>
        <span className="wd-stepcards-count">
          {view + 1} / {steps.length}
        </span>
      </div>

      <div className="wd-stepcard" key={view} data-dir={dir}>
        <span className="wd-stepcard-num">{String(view + 1).padStart(2, "0")}</span>
        <h2 className="wd-stepcard-title">{step.title}</h2>
        <p className="wd-stepcard-body">{step.body}</p>
        {view === index ? (
          <span className="wd-stepcard-tag wd-stepcard-tag--now">You are here</span>
        ) : view < index ? (
          <span className="wd-stepcard-tag wd-stepcard-tag--done">Done</span>
        ) : (
          <span className="wd-stepcard-tag">Coming up</span>
        )}
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
              className={`wd-stepdot ${i === view ? "is-view" : ""} ${
                i < index ? "is-done" : ""
              } ${i === index ? "is-current" : ""}`}
              onClick={() => {
                setDir(i > view ? "next" : "prev");
                setView(i);
              }}
              aria-label={`Step ${i + 1}: ${s.title}`}
              aria-selected={i === view}
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

      {view !== index && (
        <button
          type="button"
          className="wd-stepcards-resync"
          onClick={() => {
            setDir(index > view ? "next" : "prev");
            setView(index);
          }}
        >
          Back to current step
        </button>
      )}
    </div>
  );
}
