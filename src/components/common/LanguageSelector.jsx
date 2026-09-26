import React from 'react';

export default function LanguageSelector({ currentLang, onSelectLang }) {
  const languages = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ' }
  ];

  return (
    <div className="flex items-center bg-slate-900/90 p-0.5 sm:p-1 rounded-xl border border-amber-500/30 shrink-0">
      {languages.map((lang) => {
        const isActive = currentLang === lang.code;
        return (
          <button
            key={lang.code}
            onClick={() => onSelectLang(lang.code)}
            className={`px-1.5 sm:px-2 py-1 rounded-lg text-[11px] sm:text-xs font-bold transition-all whitespace-nowrap ${
              isActive
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
