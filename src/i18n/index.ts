
import en from "./en.json";
import fr from "./fr.json";
import es from "./es.json";
import pt from "./pt.json";
import zhCN from "./zh-CN.json";
import zhTW from "./zh-TW.json";


export type LanguageCode =
  | "en"
  | "fr"
  | "es"
  | "pt"
  | "zh-CN"
  | "zh-TW";

export interface SectionMarkerMessages {
  lookBack: string;
  lookUp: string;
  lookForward: string;
}

export interface CommonMessages {
  downloadForOfflineUse: string;
  readyForOfflineUse: string;
  readMore: string;
  readMoreOnline: string;
  readPercent: string;
  watchPercentOnline: string;
  watch: string;
  listenToPercentOnline: string;
  listenToPercent: string;
  notesClickOutsideToSave: string;
  spiritLedInsights: string;
  sendNotesAndActionPoints: string;
  bible: string;
}

export interface Messages {
  sectionMarker: SectionMarkerMessages;
  common: CommonMessages;
}

export interface LanguageOption {
  code: LanguageCode;
  label: string;
}

const messages: Record<LanguageCode, Messages> = {
  en: en as Messages,
  fr: fr as Messages,
  es: es as Messages,
  pt: pt as Messages,
  "zh-CN": zhCN as Messages,
  "zh-TW": zhTW as Messages,
};

export const languageOptions: LanguageOption[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
];

export function getMessages(lang: LanguageCode): Messages {
  return messages[lang] || messages.en;
}

export function isLanguageCode(value: string): value is LanguageCode {
  return Object.prototype.hasOwnProperty.call(messages, value);
}

export function getSafeLanguageCode(value: string | null | undefined): LanguageCode {
  if (value && isLanguageCode(value)) {
    return value;
  }
  return "en";
}

export function t(lang: LanguageCode, path: string): string {
  const parts: string[] = path.split(".");
  let current: unknown = getMessages(lang);

  for (const part of parts) {
    if (
      typeof current === "object" &&
      current !== null &&
      part in current
    ) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }

  return typeof current === "string" ? current : path;
}