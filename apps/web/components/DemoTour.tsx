"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  configureGateways,
  getGateways,
  useTaskStore,
  useUIStore,
  useSessionStore,
  useWalletStore,
  useUnlockStore,
} from "@warmdock/ui-web";
import { buildDemoScene, createDemoGateways } from "../lib/demoGateways";

// 指向面板內不同元素的選擇器(coachmark 泡泡定位用)
const READY = ".wd-panel .wd-check:not(.wd-check--done):not(:disabled)";
const SLOT = ".wd-panel .wd-slot";
const MODAL = ".wd-modal";
const CEREMONY = ".wd-ceremony";
const NAV_CTA = ".wd-nav-cta";

export type TourStepId =
  | "add"
  | "weight"
  | "finish1"
  | "tap"
  | "finish2"
  | "summary"
  | "final";

export type TourStep = {
  id: TourStepId;
  selector: string;
  /** 面板泡泡的短句 */
  hint: string;
  /** 泡泡需提到 overlay(flash)之上 */
  raise?: boolean;
  /** 左側字卡的標題與說明 */
  title: string;
  body: string;
};

export const TOUR_STEPS: TourStep[] = [
  {
    id: "add",
    selector: SLOT,
    hint: "Now add one of your own",
    title: "Add a task",
    body: "Drop one of your own promises into the dock — type it in and press enter.",
  },
  {
    id: "weight",
    selector: MODAL,
    hint: "Tap it, then set how heavy it feels",
    title: "Set the weight",
    body: "Tell WarmDock how heavy this one feels. Heavier tasks are worth more points.",
  },
  {
    id: "finish1",
    selector: READY,
    hint: "Start here — check a task off",
    title: "Check it off",
    body: "Finish a task by checking its box — you earn its points right away.",
  },
  {
    id: "tap",
    selector: CEREMONY,
    hint: "See the finish detail",
    raise: true,
    title: "The finish detail",
    body: "Tap the card to see what you just earned, then it tucks away again.",
  },
  {
    id: "finish2",
    selector: READY,
    hint: "Finish it to close your day",
    title: "Close the day",
    body: "Finish your last task to settle the day and watch it close gently.",
  },
  {
    id: "summary",
    selector: CEREMONY,
    hint: "See today's summary",
    title: "Today's summary",
    body: "Everything you kept today — tasks, points and your streak, all in one place.",
  },
  {
    id: "final",
    selector: NAV_CTA,
    hint: "Already experienced all functions",
    title: "You've seen it all",
    body: "That's the whole loop. Sign in to keep your streak and carry your dock with you.",
  },
];

const indexOfId = (id: TourStepId) => TOUR_STEPS.findIndex((s) => s.id === id);

/**
 * 跳場:把右側 demo 的 gateway + stores 換成某導覽步驟對應的狀態。
 * 重設 gateway(讓後續互動仍正確),再以 snapshot 直接灌入 stores
 * (不走 runBootstrap 的 loading 切換,避免「Loading…」閃一下)。
 * allTasksCompleted 最後才設,讓 DemoBookFlip 在新內容就緒後才觸發翻書 morph。
 */
async function applyScene(step: TourStepId): Promise<void> {
  const scene = buildDemoScene(step);
  configureGateways(createDemoGateways(scene.seed));
  const snap = await getGateways().session.bootstrap();

  useTaskStore.getState().setTasks(snap.tasks);
  useWalletStore.getState().setWallet(snap.wallet);
  useUnlockStore.getState().setStatus(snap.unlocks);

  const session = useSessionStore.getState();
  session.setToday(snap.today ?? "");
  session.setTodaySummary(snap.summary);
  session.setDaySettled(snap.settled);

  const ui = useUIStore.getState();
  ui.closeTaskDetail();
  ui.hideTaskCompletionFlash();
  ui.setComposingTask(false);

  session.setAllTasksCompleted(snap.summary?.isAllCompleted ?? false);

  if (scene.ui.modalTaskId) {
    ui.openTaskDetail(scene.ui.modalTaskId);
    ui.setComposingTask(true);
  }
  if (scene.ui.flash) {
    ui.showTaskCompletionFlash(scene.ui.flash.title, scene.ui.flash.points);
  }
}

type TourValue = {
  steps: TourStep[];
  /** 目前實際進度(由操作自動推進) */
  index: number;
  step: TourStep;
  /** 推進中的「✓ Nice」短閃 */
  flashing: boolean;
  /** finish 步已完成、但完成 overlay 尚未出現的空窗 → 泡泡先收起,避免殘留跳動 */
  awaitingOverlay: boolean;
  /** 手動跳到某步(左側字卡導覽用):同步把右側 demo 切到該步的場景 */
  jumpTo: (index: number) => void;
};

const TourContext = createContext<TourValue | null>(null);

export function useDemoTour(): TourValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useDemoTour must be used within DemoTourProvider");
  return ctx;
}

const completedOf = () =>
  useTaskStore.getState().tasks.filter((t) => t.status === "completed").length;

/**
 * 集中管理 demo 導覽進度,供面板泡泡(DemoCoachmark)與左側步驟字卡(DemoStepCards)
 * 共用。推進完全由「事件 / overlay 的出現與消失」驅動,容忍不照順序操作。
 */
export function DemoTourProvider({ children }: { children: React.ReactNode }) {
  const tasks = useTaskStore((s) => s.tasks);
  const completionFlash = useUIStore((s) => s.taskCompletionFlash);
  const allTasksCompleted = useSessionStore((s) => s.allTasksCompleted);

  const [index, setIndex] = useState(0);
  const [flashing, setFlashing] = useState(false);
  const step = TOUR_STEPS[index];

  const flashSeen = useRef(false);
  const ceremonySeen = useRef(false);
  const baseCompleted = useRef(0);
  const flashTimer = useRef<number | null>(null);
  // 手動跳步期間暫停自動推進:跳步的場景是非同步套用的,期間舊狀態
  // 可能誤觸 advance,把剛跳到的步驟又彈走。
  const manualJump = useRef(false);

  const hasDraft = tasks.some((t) => t.status === "draft");
  const completed = tasks.filter((t) => t.status === "completed").length;

  const advance = useCallback((nextId: TourStepId) => {
    setFlashing(true);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => {
      setIndex(indexOfId(nextId));
      setFlashing(false);
    }, 650);
  }, []);

  useEffect(
    () => () => {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
    },
    []
  );

  // 切換步驟:清 overlay 追蹤 + 記錄完成數基線
  useEffect(() => {
    flashSeen.current = false;
    ceremonySeen.current = false;
    baseCompleted.current = completedOf();
  }, [index]);

  // 完成偵測 + 推進
  useEffect(() => {
    if (flashing || manualJump.current) return;
    switch (step.id) {
      case "add":
        if (hasDraft) advance("weight");
        break;
      case "weight":
        if (!hasDraft) advance("finish1");
        break;
      case "finish1":
        if (completionFlash) advance("tap");
        else if (allTasksCompleted) advance("summary"); // 提前完成最後一件
        break;
      case "tap":
        if (completionFlash) flashSeen.current = true;
        else if (flashSeen.current) advance("finish2");
        break;
      case "finish2":
        if (allTasksCompleted) advance("summary");
        break;
      case "summary":
        if (allTasksCompleted) ceremonySeen.current = true;
        else if (ceremonySeen.current) advance("final");
        break;
      // final: 終點
    }
  }, [step, flashing, hasDraft, completionFlash, allTasksCompleted, advance]);

  // finish 步:任務已完成但 flash/ceremony 還沒出現的空窗,先收起泡泡
  const awaitingOverlay =
    (step.id === "finish1" || step.id === "finish2") &&
    completed > baseCompleted.current &&
    !completionFlash &&
    !allTasksCompleted;

  // 手動跳步:取消推進中的短閃、把右側 demo 換成該步場景、再切 index。
  // 場景非同步套用期間暫停自動推進,套用完(+一幀)再恢復。
  const jumpTo = useCallback((target: number) => {
    if (target < 0 || target >= TOUR_STEPS.length) return;
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    setFlashing(false);
    manualJump.current = true;
    void applyScene(TOUR_STEPS[target].id).finally(() => {
      requestAnimationFrame(() => {
        manualJump.current = false;
      });
    });
    setIndex(target);
  }, []);

  return (
    <TourContext.Provider
      value={{ steps: TOUR_STEPS, index, step, flashing, awaitingOverlay, jumpTo }}
    >
      {children}
    </TourContext.Provider>
  );
}
