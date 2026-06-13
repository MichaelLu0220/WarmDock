import type { AppErrorCode } from "../errors";
import type { DifficultyBand } from "../types";
import { MANTRAS_ZH_TW, zhTW } from "./zh-TW";

export type MessageKey = keyof typeof zhTW;

type Params = Record<string, string | number>;

/**
 * 取字串。key 有型別保護,打錯直接編譯錯誤。
 * 目前固定 zh-TW;未來依 settings.locale 切換字典。
 */
export function t(key: MessageKey, params?: Params): string {
  let text: string = zhTW[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/** 錯誤碼 → 在地化訊息 */
export function errorMessage(code: AppErrorCode): string {
  return t(`error.${code}` as MessageKey);
}

export function difficultyBandLabel(band: DifficultyBand): string {
  return t(`difficulty.${band}` as MessageKey);
}

/** 隨機抽一句 mantra(每次打開 panel 抽一次)。 */
export function pickRandomMantra(): string {
  return MANTRAS_ZH_TW[Math.floor(Math.random() * MANTRAS_ZH_TW.length)];
}
