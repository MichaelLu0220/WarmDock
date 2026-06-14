import type { AppErrorCode } from "../errors";
import type { DifficultyBand } from "../types";
import { MANTRAS_ZH_TW, zhTW } from "./zh-TW";
import { en, MANTRAS_EN } from "./en";

export type MessageKey = keyof typeof zhTW;
export type Locale = "zh-TW" | "en";

type Params = Record<string, string | number>;

const DICTIONARIES: Record<Locale, Record<MessageKey, string>> = {
  "zh-TW": zhTW,
  en,
};

const MANTRAS: Record<Locale, readonly string[]> = {
  "zh-TW": MANTRAS_ZH_TW,
  en: MANTRAS_EN,
};

// Default zh-TW so the desktop app is unchanged; the web app calls setLocale("en").
let activeLocale: Locale = "zh-TW";

export function setLocale(locale: string): void {
  if (locale === "en" || locale === "zh-TW") {
    activeLocale = locale;
  }
}

export function getLocale(): Locale {
  return activeLocale;
}

/**
 * Look up a string. Keys are type-checked, so typos fail at compile time.
 * Falls back to zh-TW if a key is somehow missing from the active dictionary.
 */
export function t(key: MessageKey, params?: Params): string {
  let text: string = DICTIONARIES[activeLocale][key] ?? zhTW[key];
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}

/** Error code -> localized message */
export function errorMessage(code: AppErrorCode): string {
  return t(`error.${code}` as MessageKey);
}

export function difficultyBandLabel(band: DifficultyBand): string {
  return t(`difficulty.${band}` as MessageKey);
}

/** Pick a random mantra (once per panel open). */
export function pickRandomMantra(): string {
  const pool = MANTRAS[activeLocale];
  return pool[Math.floor(Math.random() * pool.length)];
}
