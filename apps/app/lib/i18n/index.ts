import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import th from "./locales/th.json";

export const defaultNS = "common";
export const resources = {
  en: { common: en },
  th: { common: th },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: "en",
    supportedLngs: ["en", "th"],
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        appName: import.meta.env.VITE_APP_NAME || "NexusPoint",
      },
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
