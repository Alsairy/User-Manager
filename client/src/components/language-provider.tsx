import { createContext, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type Language = "ar" | "en";

type LanguageProviderProps = {
  children: React.ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
};

type LanguageProviderState = {
  language: Language;
  setLanguage: (language: Language) => void;
  isRTL: boolean;
  direction: "rtl" | "ltr";
};

const initialState: LanguageProviderState = {
  language: "ar",
  setLanguage: () => null,
  isRTL: true,
  direction: "rtl",
};

const LanguageProviderContext = createContext<LanguageProviderState>(initialState);

export function LanguageProvider({
  children,
  defaultLanguage = "ar",
  storageKey = "language",
  ...props
}: LanguageProviderProps) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(storageKey) as Language;
    return stored || defaultLanguage;
  });

  const isRTL = language === "ar";
  const direction: "rtl" | "ltr" = isRTL ? "rtl" : "ltr";

  useEffect(() => {
    const root = window.document.documentElement;
    root.dir = direction;
    root.lang = language;
    
    if (isRTL) {
      root.classList.add("rtl");
      root.classList.remove("ltr");
    } else {
      root.classList.add("ltr");
      root.classList.remove("rtl");
    }

    i18n.changeLanguage(language);
  }, [language, direction, isRTL, i18n]);

  const setLanguage = (newLanguage: Language) => {
    localStorage.setItem(storageKey, newLanguage);
    setLanguageState(newLanguage);
  };

  const value = {
    language,
    setLanguage,
    isRTL,
    direction,
  };

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageProviderContext);

  if (context === undefined)
    throw new Error("useLanguage must be used within a LanguageProvider");

  return context;
};
