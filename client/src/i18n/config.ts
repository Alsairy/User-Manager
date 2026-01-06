import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enPages from "./locales/en/pages.json";
import arCommon from "./locales/ar/common.json";
import arNavigation from "./locales/ar/navigation.json";
import arPages from "./locales/ar/pages.json";

const resources = {
  en: {
    common: enCommon,
    navigation: enNavigation,
    pages: enPages,
  },
  ar: {
    common: arCommon,
    navigation: arNavigation,
    pages: arPages,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "ar",
    defaultNS: "common",
    ns: ["common", "navigation", "pages"],
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "language",
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
