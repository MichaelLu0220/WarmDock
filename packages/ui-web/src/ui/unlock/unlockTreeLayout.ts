/**
 * 能力配置節點的共用文案與兩套幾何。
 * compact 專門填滿首頁同尺寸的窄卡片；expanded 用於中央放大版。
 */
export type TreeDirection = "up" | "down" | "left" | "right";
export type UnlockCategory =
  | "core"
  | "capacity"
  | "focus"
  | "time"
  | "analysis";
export type UnlockTreeMode = "compact" | "expanded";

export type TreeNodeLayout = {
  node_id: string;
  displayName: string;
  mantra: string;
  description: string;
  effectLines: string[];
  category: UnlockCategory;
  icon: IconKey;
  x: number;
  y: number;
  direction?: TreeDirection;
};

export type UnlockTreeLayoutConfig = {
  viewBox: { w: number; h: number };
  nodeSize: number;
  centerSize: number;
  center: { x: number; y: number };
  nodes: TreeNodeLayout[];
};

export type IconKey =
  | "sparkle"
  | "grid4"
  | "grid5"
  | "grid6"
  | "grid7"
  | "star"
  | "clock"
  | "bars";

type NodeContent = Omit<TreeNodeLayout, "x" | "y" | "direction">;

type NodeGeometry = Pick<TreeNodeLayout, "x" | "y" | "direction">;

const NODE_CONTENT: NodeContent[] = [
  {
    node_id: "root.awaken",
    displayName: "覺醒",
    mantra: "按下去,開始一段與自己的承諾。",
    description: "開啟能力配置。這不是加成節點，而是整棵樹願意跟你說話的開關。",
    effectLines: [
      "啟用能力配置系統",
      "允許後續節點進入可解鎖狀態",
      "作為所有分支的共同前置",
    ],
    category: "core",
    icon: "sparkle",
  },
  {
    node_id: "slots.4",
    displayName: "多一個容器",
    mantra: "多一個位置,多一份承諾。",
    description: "把今天可視任務槽位擴成 4 格，讓行程不必在狹窄的框裡打架。",
    effectLines: ["可見任務槽位提升至 4 格", "主畫面會立即多出新的任務位置"],
    category: "capacity",
    icon: "grid4",
  },
  {
    node_id: "slots.5",
    displayName: "再深一些",
    mantra: "你正在擴大今天的重量。",
    description:
      "再往上開一格，讓今天的容量更像一個真的工作台，而不是零時拼裝櫃。",
    effectLines: ["可見任務槽位提升至 5 格", "需先解鎖『多一個容器』"],
    category: "capacity",
    icon: "grid5",
  },
  {
    node_id: "slots.6",
    displayName: "不只於此",
    mantra: "野心需要空間容納。",
    description:
      "為更高密度的一天預留空間。你不是變更忙，而是終於裝得下本來就想做的事。",
    effectLines: ["可見任務槽位提升至 6 格", "需先解鎖『再深一些』"],
    category: "capacity",
    icon: "grid6",
  },
  {
    node_id: "slots.7",
    displayName: "完整的一日",
    mantra: "七件事,一個你。",
    description: "把單日容量推到更完整的上限。這是容量支線的最終節點。",
    effectLines: ["可見任務槽位提升至 7 格", "需先解鎖『不只於此』"],
    category: "capacity",
    icon: "grid7",
  },
  {
    node_id: "focus.basic",
    displayName: "焦點任務",
    mantra: "有些事值得更用力地完成。",
    description:
      "開啟焦點任務概念，讓重要的事可以被標記，而不是混在一排平民裡。",
    effectLines: ["啟用焦點任務功能", "後續可延伸出額外獎勵或專注玩法"],
    category: "focus",
    icon: "star",
  },
  {
    node_id: "time.custom_refresh",
    displayName: "調整節奏",
    mantra: "你的一天,從你選的時刻開始。",
    description:
      "讓每日刷新時間不再被 00:00 綁架，作息晚的人終於不用被系統偷襲。",
    effectLines: ["啟用自訂每日刷新時間", "更貼近個人作息節奏"],
    category: "time",
    icon: "clock",
  },
  {
    node_id: "analysis.weekly",
    displayName: "一週之後",
    mantra: "每七天,看看自己走了多遠。",
    description: "開始看週期，而不是只盯著今天。這會讓你的系統多一點長期視角。",
    effectLines: ["啟用每週分析功能", "可回顧近七天的完成趨勢"],
    category: "analysis",
    icon: "bars",
  },
];

const COMPACT_GEOMETRY: Record<string, NodeGeometry> = {
  "root.awaken": { x: 170, y: 300 },
  "slots.4": { x: 170, y: 195, direction: "up" },
  "slots.5": { x: 78, y: 125, direction: "left" },
  "slots.6": { x: 180, y: 92, direction: "up" },
  "slots.7": { x: 285, y: 48, direction: "right" },
  "focus.basic": { x: 170, y: 445, direction: "down" },
  "time.custom_refresh": { x: 278, y: 375, direction: "right" },
  "analysis.weekly": { x: 62, y: 375, direction: "left" },
};

const EXPANDED_GEOMETRY: Record<string, NodeGeometry> = {
  "root.awaken": { x: 280, y: 480 },
  "slots.4": { x: 280, y: 360, direction: "up" },
  "slots.5": { x: 175, y: 250, direction: "left" },
  "slots.6": { x: 300, y: 145, direction: "up" },
  "slots.7": { x: 415, y: 60, direction: "right" },
  "focus.basic": { x: 280, y: 640, direction: "down" },
  "time.custom_refresh": { x: 450, y: 600, direction: "right" },
  "analysis.weekly": { x: 110, y: 600, direction: "left" },
};

function createNodes(geometry: Record<string, NodeGeometry>): TreeNodeLayout[] {
  return NODE_CONTENT.map((content) => ({
    ...content,
    ...geometry[content.node_id],
  }));
}

export const UNLOCK_TREE_LAYOUTS: Record<
  UnlockTreeMode,
  UnlockTreeLayoutConfig
> = {
  compact: {
    viewBox: { w: 340, h: 520 },
    nodeSize: 68,
    centerSize: 90,
    center: { x: 170, y: 300 },
    nodes: createNodes(COMPACT_GEOMETRY),
  },
  expanded: {
    viewBox: { w: 560, h: 860 },
    nodeSize: 96,
    centerSize: 120,
    center: { x: 280, y: 480 },
    nodes: createNodes(EXPANDED_GEOMETRY),
  },
};

export function getUnlockTreeLayout(
  mode: UnlockTreeMode
): UnlockTreeLayoutConfig {
  return UNLOCK_TREE_LAYOUTS[mode];
}

export function findLayout(
  nodeId: string,
  nodes: TreeNodeLayout[] = UNLOCK_TREE_LAYOUTS.expanded.nodes
): TreeNodeLayout | undefined {
  return nodes.find((node) => node.node_id === nodeId);
}
