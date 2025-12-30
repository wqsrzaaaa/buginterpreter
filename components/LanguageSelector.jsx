import { useState } from "react";
import { Globe, ChevronDown } from "lucide-react";
import { useLanguage } from "./context/LangProvider";

const languages = [
    { code: "en-US", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ru-RU", label: "Russian" },
  { code: "zh-CN", label: "Chinese" },
];

export default function LanguageSelector() {
  const [open, setOpen] = useState(false);
  const { language, setLanguage } = useLanguage();

  const handleSelect = (lang) => {
    setLanguage(lang);
    setOpen(false);
  };

  return (
    <div className="relative w-44">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-md bg-background text-sm"
      >
        <div className="flex items-center gap-2">
          <Globe size={16} />
          <span>{language.label}</span>
        </div>
        <ChevronDown size={16} />
      </button>

      {open && (
        <div className="absolute mt-2 w-full bg-background border border-border rounded-md shadow-lg z-50">
          {languages.map((lang) => (
            <div
              key={lang.code}
              onClick={() => handleSelect(lang)}
              className="px-3 py-2 cursor-pointer bg-background text-sm"
            >
              {lang.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
