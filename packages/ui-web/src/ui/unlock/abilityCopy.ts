/**
 * 能力節點的英文文案(web 用)。內容沿用桌面/共用的 `unlockTreeLayout.ts` 那套
 * 豐富描述,翻成英文;web app 全英文,故能力頁讀這裡而非 layout 的 zh 文字。
 * (桌面 UnlockTree 仍用 unlockTreeLayout 的 zh。)
 */
export type AbilityCopy = {
  name: string;
  tagline: string;
  description: string;
  effects: string[];
};

export const ABILITY_COPY: Record<string, AbilityCopy> = {
  "root.awaken": {
    name: "Awaken",
    tagline: "Press it — begin a promise to yourself.",
    description:
      "Opens ability configuration. Not a stat boost, but the switch that makes the whole tree willing to speak to you.",
    effects: [
      "Enables the ability system",
      "Lets later nodes become unlockable",
      "The shared prerequisite for every branch",
    ],
  },
  "slots.4": {
    name: "One More Slot",
    tagline: "One more place, one more promise.",
    description:
      "Expands today's visible task slots to 4, so your plans stop fighting inside a cramped frame.",
    effects: ["Visible task slots raised to 4", "A new slot appears right away"],
  },
  "slots.5": {
    name: "A Little Deeper",
    tagline: "You're widening the weight of today.",
    description:
      "Open one more slot, so today feels like a real workbench instead of a last-minute shelf.",
    effects: ["Visible task slots raised to 5", "Requires One More Slot first"],
  },
  "slots.6": {
    name: "Not Just This",
    tagline: "Ambition needs room to hold it.",
    description:
      "Make room for a denser day. You're not busier — you can finally fit what you always meant to do.",
    effects: ["Visible task slots raised to 6", "Requires A Little Deeper first"],
  },
  "slots.7": {
    name: "A Full Day",
    tagline: "Seven things, one you.",
    description:
      "Push a single day to its fuller limit. The final node of the capacity branch.",
    effects: ["Visible task slots raised to 7", "Requires Not Just This first"],
  },
  "focus.basic": {
    name: "Focus Task",
    tagline: "Some things deserve to be finished harder.",
    description:
      "Introduces focus tasks, so what matters can be marked instead of blending into the crowd.",
    effects: [
      "Enables focus tasks",
      "Room for extra rewards or focus mechanics later",
    ],
  },
  "time.custom_refresh": {
    name: "Set the Rhythm",
    tagline: "Your day begins at the hour you choose.",
    description:
      "Frees the daily reset from midnight, so night owls stop getting ambushed by the system.",
    effects: ["Enables a custom daily reset time", "Closer to your own rhythm"],
  },
  "analysis.weekly": {
    name: "After a Week",
    tagline: "Every seven days, see how far you've come.",
    description:
      "Start seeing cycles, not just today — a little long-term perspective for your system.",
    effects: [
      "Enables weekly analysis",
      "Review the last seven days of completion",
    ],
  },
};
