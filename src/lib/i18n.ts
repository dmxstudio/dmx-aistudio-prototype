import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { es } from '../locales/es'
import { en } from '../locales/en'

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: localStorage.getItem('lang') || 'es',
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => localStorage.setItem('lang', lng))

export default i18n
