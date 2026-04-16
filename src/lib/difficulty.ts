import type { DifficultyBand } from "../commands/types";

/**
 * 每個難度 band 對應的可選分數。
 * easy → [1,2,3]、medium → [2,3,4]、hard → [3,4,5]
 */
export const DIFFICULTY_OPTIONS: Record<DifficultyBand, (1 | 2 | 3 | 4 | 5)[]> = {
  easy: [1, 2, 3],
  medium: [2, 3, 4],
  hard: [3, 4, 5],
};

/**
 * Band 的顯示文字(zh-TW)。
 * 未來要多語系時,這裡是唯一需要改的地方。
 */
export const BAND_LABELS: Record<DifficultyBand, string> = {
  easy: "簡單",
  medium: "中等",
  hard: "困難",
};

/**
 * 根據任務標題建議難度 band(MVP 版:關鍵字規則)。
 * 未來可以替換為 AI 建議,介面不變。
 */
export function suggestDifficulty(title: string): DifficultyBand {
  const lower = title.toLowerCase();

  const hardKeywords = ["報告", "重構", "遷移", "deploy", "release", "refactor"];
  const easyKeywords = ["買", "回覆", "確認", "check", "reply", "read"];

  if (hardKeywords.some((k) => lower.includes(k))) return "hard";
  if (easyKeywords.some((k) => lower.includes(k))) return "easy";
  return "medium";
}

/**
 * 取得某個 band 的預設選擇(中間值)。
 * 未來若要做「一鍵套用建議」按鈕時會用到。
 */
export function getDefaultScoreForBand(band: DifficultyBand): 1 | 2 | 3 | 4 | 5 {
  const options = DIFFICULTY_OPTIONS[band];
  return options[Math.floor(options.length / 2)];
}