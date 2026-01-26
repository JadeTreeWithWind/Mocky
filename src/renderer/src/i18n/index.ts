import { createI18n } from 'vue-i18n'
import zhTW from '../locales/zh-TW.json'
import enUS from '../locales/en-US.json'

const getUserLocale = (): string => {
  const savedLocale = localStorage.getItem('user-locale')
  if (savedLocale) {
    return savedLocale
  }

  const systemLocale = navigator.language
  if (systemLocale.startsWith('en')) {
    return 'en-US'
  }

  return 'zh-TW'
}

const i18n = createI18n({
  legacy: false, // Composition API
  globalInjection: true, // Enable $t in templates
  locale: getUserLocale(), // default locale
  fallbackLocale: 'en-US', // fallback locale
  messages: {
    'zh-TW': zhTW,
    'en-US': enUS
  }
})

export default i18n
