'use client'
import { createContext, useContext, useState, ReactNode } from 'react'
import { Lang, translations } from '@/lib/i18n'

type AnyTranslation = typeof translations[Lang]

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  t: AnyTranslation
}

const LangContext = createContext<LangContextType>({
  lang: 'th',
  setLang: () => {},
  t: translations.th as AnyTranslation,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('th')
  const t = translations[lang] as AnyTranslation
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
