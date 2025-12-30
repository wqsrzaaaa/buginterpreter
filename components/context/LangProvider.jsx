"use client";

import { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const LangProvider = ({ children }) => {
  const [language, setLanguage] = useState({ code: "en", label: "English" });

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
